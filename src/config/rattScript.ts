import Ratt from "@triply/ratt";
import fromJson from "@triply/ratt/lib/middlewares/reading/fromJson";

import toNtriplesString from "../utils/ratt/middlewares/toNtriplesString";
import { ApplyTransformation } from "../Definitions";
import { cleanCsvValue, getBaseIdentifierIri, getBasePredicateIri } from "../utils/helpers";
import fromArray from "../utils/ratt/middlewares/fromArray";

/**
 * Different from the other transformation script, as it is also used in the wizard to transform the data. See `/src/utils/ratt/getTransformation.ts` to get the transformation script itself
 * When making changes to this file make sure to copy the result to `/src/utils/ratt/applyTransformation.txt`
 */

/**
 * Applies the transformation using RATT
 * @param opts
 */
const applyTransformation: ApplyTransformation = async (opts) => {
  if (opts.type === "ratt" && Array.isArray(opts.source)) {
    const app = new Ratt({
      prefixes: {
        baseDefIri: getBasePredicateIri(opts.config.baseIri.toString()),
        baseInstanceIri: getBaseIdentifierIri(opts.config.baseIri.toString()),
      },
    });

    const getColumnConfig = (colName: string) =>
      opts.config.columnConfiguration.find((col) => col.columnName === colName);

    app.use(fromArray(opts.source));

    const keyColumn =
      typeof opts.config.key === "number" &&
      opts.config.key >= 0 &&
      opts.config.columnConfiguration[opts.config.key].columnName;
    app.use((ctx, next) => {
      const keyVal = keyColumn && ctx.record[keyColumn] ? ctx.record[keyColumn] : ctx.recordId;
      const subject = app.prefix.baseInstanceIri(keyVal ? cleanCsvValue(keyVal) : "" + ctx.recordId);

      for (const [col, value] of Object.entries(ctx.record)) {
        if (col === keyColumn) continue;
        if (ctx.record[col] && typeof value === "string") {
          const colConf = getColumnConfig(col);
          if (!colConf) continue;
          const predicate = colConf.propertyIri
            ? ctx.store.iri(colConf.propertyIri)
            : app.prefix.baseDefIri(cleanCsvValue(col));
          const object =
            colConf.iriPrefix !== undefined
              ? ctx.store.iri(`${colConf.iriPrefix}${cleanCsvValue(value)}`)
              : ctx.store.literal(ctx.record[col]);

          ctx.store.addQuad(subject, predicate, object);
        }
      }
      ctx.store.addQuad(
        subject,
        app.prefix.rdf("type"),
        typeof opts.config.baseIri === "string" ? ctx.store.iri(opts.config.resourceClass) : opts.config.baseIri
      );
      return next(ctx.record, ctx.store);
    });
    const { mw, end } = toNtriplesString();
    app.use(mw);
    await app.run();
    return end();
  } else {
    throw new Error("Not supported");
  }
};
export default applyTransformation;
