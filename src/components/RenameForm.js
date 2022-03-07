import * as React from "react";
import {
  StyleSheet,
  View,
  Text,
  Button,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { useSelector } from "react-redux";
import { updateDoc, doc } from "firebase/firestore";
import db from "../../firebase";
import { navigationRef } from "../../App";

function RenameForm(props) {
  const fileRenaming = useSelector(
    (state) => state.recordingAudioReducer.fileRenaming
  );
  const docID = useSelector((state) => state.recordingAudioReducer.docID);
  const currentUser = useSelector((state) => state.user.currentUser);
  const [newFilename, setNewFileName] = React.useState(fileRenaming);

  const onSubmitRename = async (newFilename) => {
    const fileNameRef = doc(db, `recordings/${currentUser.uid}/files`, docID);
    await updateDoc(fileNameRef, {
      fileName: newFilename,
    });
    navigationRef.navigate("Home");
  };

  return (
    <SafeAreaView>
      <ScrollView style={styles.container}>
        <Text>RenameForm page</Text>
        <Text>{fileRenaming}</Text>
        <TextInput
          onChangeText={(text) => setNewFileName(text)}
          value={newFilename}
          style={styles.renameInput}
        />
        <TouchableOpacity
          activeOpacity={0.8}
          style={{
            padding: 5,
            backgroundColor: "red",
            margin: 10,
            borderRadius: 10,
            height: 45,
            justifyContent: "center",
          }}
          onPress={() => onSubmitRename(newFilename)}
        >
          <Text style={{ color: "#fff", textAlign: "center" }}>Rename</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    height: "100%",
  },
  renameInput: {
    fontSize: 15,
    color: "green",
    maxWidth: 200,
    width: 200,
    borderWidth: 0.5,
    borderColor: "green",
    borderRadius: 5,
    padding: 5,
    margin: 10,
  },
});

export default RenameForm;
