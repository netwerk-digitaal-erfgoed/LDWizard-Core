import * as React from "react";
import {
  Box,
  Dialog,
  TextField,
  Button,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from "@material-ui/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import {
  userDatasetsState,
  currentDsIdState,
  currentAccountDataSelector,
  currentTokenState,
} from "../../state/clientJs";
import App from "@triply/triplydb";
import { wizardAppConfig } from "../../config";
interface Props {}

const AddDataset: React.FC<Props> = ({}) => {
  // Global state
  const [datasets, setDatasets] = useRecoilState(userDatasetsState);
  const setSelectedDataset = useSetRecoilState(currentDsIdState);
  const selectedAccount = useRecoilValue(currentAccountDataSelector);
  const token = useRecoilValue(currentTokenState);

  // Local state
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [newDatasetName, setNewDatasetName] = React.useState("");
  const [datasetCreationError, setDatasetCreationError] = React.useState<string>();
  const [creatingDs, setCreatingDs] = React.useState(false);

  const createNewDataset = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (newDatasetName.length === 0) return;
    setCreatingDs(true);
    try {
      const currentAccount = await App.get(token).getAccount(selectedAccount?.accountName);
      const accountInfo = await currentAccount.getInfo();
      const isLightUser = accountInfo.type === "user" && accountInfo.role === "light";
      const datasetAccessLevel = isLightUser ? "public" : wizardAppConfig.newDatasetAccessLevel;
      const newDataset = await currentAccount.addDataset({ name: newDatasetName, accessLevel: datasetAccessLevel });
      const datasetInfo = await newDataset.getInfo();
      setDatasets([datasetInfo]);
      setSelectedDataset(datasets.length);
      setCreateDialogOpen(false);
    } catch (e) {
      console.error(e);
      setDatasetCreationError(e.message);
    } finally {
      setCreatingDs(false);
    }
  };
  return (
    <Box>
      <Dialog
        open={createDialogOpen}
        onClose={() => {
          setDatasetCreationError(undefined), setCreateDialogOpen(false);
        }}
      >
        <DialogTitle>Add new dataset</DialogTitle>
        <DialogContent>
          <form id="addDatasetForm">
            <TextField
              value={newDatasetName}
              disabled={creatingDs}
              onChange={(event) => {
                setNewDatasetName(event.currentTarget.value), setDatasetCreationError(undefined);
              }}
              error={!!datasetCreationError}
              helperText={datasetCreationError}
            />
          </form>
        </DialogContent>
        <DialogActions>
          <Button
            type="submit"
            form="addDatasetForm"
            color="primary"
            disabled={creatingDs || !!datasetCreationError || newDatasetName.length === 0}
            onClick={createNewDataset}
          >
            Create dataset
          </Button>
          <Button
            disabled={creatingDs}
            onClick={() => {
              setCreateDialogOpen(false), setDatasetCreationError(undefined);
            }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
      <IconButton onClick={() => setCreateDialogOpen(true)} title="Create a new dataset">
        <FontAwesomeIcon icon="plus" size="sm" />
      </IconButton>
    </Box>
  );
};

export default AddDataset;
