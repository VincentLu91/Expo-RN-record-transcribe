import * as React from "react";
import {
  StyleSheet,
  View,
  Text,
  Button,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import db from "../../firebase";
import { navigationRef } from "../../App";
import {
  setCurrentPlayingStatus,
  setSlidingPosition,
  setSound,
  setSoundStop,
} from "../redux/recording/actions";

function DeleteRecording(props) {
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.user.currentUser);

  const sound = useSelector((state) => state.recordingAudioReducer.sound);
  const originalFilename = useSelector(
    (state) => state.recordingAudioReducer.originalFilename
  );

  async function deleteRecording(originalFilename) {
    await sound?.stopAsync();
    //await sound?.unloadAsync();
    dispatch(setSlidingPosition(0));
    dispatch(setSound(null));
    dispatch(setSoundStop(true));
    dispatch(setCurrentPlayingStatus(null));
    console.log("deleting recording");
    const deleteRef = collection(db, `recordings/${currentUser.uid}/files`);
    let deleteQuery = query(
      deleteRef,
      where("user", "==", currentUser.uid),
      where("originalFilename", "==", originalFilename)
    );
    const querySnapshot = await getDocs(deleteQuery);
    console.log("Delete querySnapshot: ", querySnapshot);
    querySnapshot.forEach(async (doc) => {
      await deleteDoc(doc.ref);
    });
    navigationRef.navigate("Home");
  }

  return (
    <SafeAreaView>
      <ScrollView style={styles.container}>
        <Text>Delete Recording page</Text>
        <Text>You sure you want to delete?</Text>
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
          onPress={() => deleteRecording(originalFilename)}
        >
          <Text style={{ color: "#fff", textAlign: "center" }}>Delete</Text>
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

export default DeleteRecording;
