import * as React from "react";
import { useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Audio } from "expo-av";
import { msToTime } from "../data-helpers/helper-functions";
import { useDispatch, useSelector } from "react-redux";
import {
  setCurrentSoundPlaying,
  setCurrentPlayingStatus,
  setDurationMillis,
  setSlidingPosition,
  setSound,
  setSoundPause,
  setSoundStop,
  setRecording,
  setIsRecording,
  setRecordingDuration,
  setFileRenaming,
  setOriginalFilename,
  setDocID,
} from "../redux/recording/actions";
import { Feather } from "@expo/vector-icons";
import { FontAwesome } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { SwipeListView } from "react-native-swipe-list-view";
import db, { storage } from "../../firebase";
import { navigationRef } from "../../App";
import { printTranscription } from "../redux/language/actions";
import LiveAudioStream from "react-native-live-audio-stream";
import { collection, query, where, getDocs } from "firebase/firestore";
import { ref, getDownloadURL } from "firebase/storage";

Audio.setAudioModeAsync({
  staysActiveInBackground: true,
  shouldDuckAndroid: true,
  interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
  playThroughEarpieceAndroid: true,
});

function Library({ navigation }) {
  const dispatch = useDispatch();

  const currentPlayingStatus = useSelector(
    (state) => state.recordingAudioReducer.currentPlayingStatus
  );
  const durationMillis = useSelector(
    (state) => state.recordingAudioReducer.durationMillis
  );
  const slidingPosition = useSelector(
    (state) => state.recordingAudioReducer.slidingPosition
  );
  const sound = useSelector((state) => state.recordingAudioReducer.sound);
  const hasSoundPaused = useSelector(
    (state) => state.recordingAudioReducer.hasSoundPaused
  );
  const hasSoundStopped = useSelector(
    (state) => state.recordingAudioReducer.hasSoundStopped
  );
  const recording = useSelector(
    (state) => state.recordingAudioReducer.recording
  );
  const currentUser = useSelector((state) => state.user.currentUser);

  const [cloudRecordingList, setCloudRecordingList] = React.useState([]);

  const downloadAudio = async (fileName) => {
    const uri = getDownloadURL(ref(storage, fileName));
    return uri;
  };

  const loadRecordings = useCallback(async () => {
    console.log("+++++++ debug when page is focused");
    const recordingRef = collection(db, `recordings/${currentUser.uid}/files`);
    const recordingRefQuery = query(
      recordingRef,
      where("user", "==", currentUser.uid)
    );
    const querySnapshot = await getDocs(recordingRefQuery);
    if (querySnapshot) {
      const data = [];
      const audioDownloads = [];
      querySnapshot.forEach(async (documentSnapshot) => {
        if (documentSnapshot.exists()) {
          const originalFilename = documentSnapshot.data().originalFilename;
          data.push(documentSnapshot.data());
          audioDownloads.push(downloadAudio(originalFilename));
        }
      });

      Promise.all(audioDownloads).then((res) => {
        setCloudRecordingList(
          data.map((el, i) => {
            //console.log("res[i]: ", res[i]);
            return { ...el, filepath: res[i] };
          })
        );
      });
    }
  });

  React.useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      setTimeout(() => loadRecordings(), 2000);
    });
    return unsubscribe;
  }, [navigation, loadRecordings]);

  React.useEffect(() => {
    console.log("Cloud Recording List is: ", cloudRecordingList);
  }, [cloudRecordingList]);

  async function playSound(filepath, currentSound) {
    console.log("If any recording, stop now");
    dispatch(setRecording(undefined));
    dispatch(setIsRecording(false));
    dispatch(setRecordingDuration(0));
    await recording?.stopAndUnloadAsync();

    console.log("Loading Sound");
    // Reset first
    if (currentSound) {
      console.log("current");
      await currentSound.unloadAsync();
      currentSound.setOnPlaybackStatusUpdate(null);
      // setSound(null);
      dispatch(setSound(null));
      dispatch(setSoundStop(true));
      // sound = null;
    }
    LiveAudioStream.stop();
    if (global.socket) {
      global.socket.onclose = (event) => {
        console.log(event);
        global.socket = null;
      };
    }
    const { sound } = await Audio.Sound.createAsync(
      { uri: filepath },
      { shouldPlay: false }
    );
    const result = await sound.getStatusAsync();
    const durationMillis = result.durationMillis;
    dispatch(setDurationMillis(durationMillis));
    // setSound(sound); // Just to toggle play overlay
    dispatch(setSound(sound));
    dispatch(setSoundPause(false));
    dispatch(setSoundStop(false));
    dispatch(setSlidingPosition(0));

    console.log("Playing Sound");
    sound.setOnPlaybackStatusUpdate(async (status) => {
      dispatch(
        setCurrentPlayingStatus({
          uri: status.uri,
          isPlaying: status.isPlaying,
        })
      );
      if (status.didJustFinish === true) {
        // audio has finished!
        // Reset
        await sound.unloadAsync();
        dispatch(setSlidingPosition(0));
        dispatch(setSound(null));
        dispatch(setSoundStop(true));
        dispatch(setCurrentPlayingStatus(null));
      }
      if (status.positionMillis && status.isPlaying) {
        // status update, when we stop sliding we pause the audio and it takes time to actually pause and change position
        dispatch(setSlidingPosition(status.positionMillis));
        console.log("Status update: ", status.positionMillis);
      }
    });

    await sound.playAsync();

    dispatch(setCurrentSoundPlaying(sound));
  }

  async function stopSound() {
    await sound.stopAsync();
    dispatch(setSlidingPosition(0));
    dispatch(setSound(null));
    dispatch(setSoundStop(true));
  }

  async function resumeSound() {
    console.log("Resuming Sound", sound);
    await sound.playAsync();
    dispatch(setSoundPause(false));
  }

  async function pauseSound() {
    console.log("Pausing Sound", sound);
    await sound.pauseAsync();
    dispatch(setSoundPause(true));
  }

  // function to rename a filename:
  async function renameAudioFile(fileName, originalFilename) {
    dispatch(setFileRenaming(fileName));
    const q = query(
      collection(db, `recordings/${currentUser.uid}/files`),
      where("fileName", "==", fileName),
      where("originalFilename", "==", originalFilename)
    );
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      console.log(doc.id, " => ", doc.data());
      dispatch(setDocID(doc.id));
    });
    navigationRef.navigate("RenameForm");
  }

  // function to delete a recording:
  async function deleteRecording(originalFilename) {
    dispatch(setSound(sound));
    dispatch(setOriginalFilename(originalFilename));
    navigationRef.navigate("DeleteRecording");
  }

  async function viewContent(transcription) {
    dispatch(printTranscription(transcription));
    navigationRef.navigate("Content");
  }

  const renderItem = ({ item, index }) => {
    const originalFilename = item.originalFilename;

    const isCurrentPlayingFile =
      currentPlayingStatus?.isPlaying &&
      currentPlayingStatus?.uri.includes(originalFilename);
    return (
      <View
        key={index}
        style={{
          flexDirection: "row",
          height: 70,
          justifyContent: "space-between",
          backgroundColor: "#CCC",
        }}
      >
        <View style={{ justifyContent: "center", margin: 20 }}>
          <Text style={{ color: "green", maxWidth: 200, textAlign: "left" }}>
            {item.fileName}
          </Text>
          <Text style={{ fontSize: 13, color: "gray" }}>
            {item.recordingdate}
          </Text>
        </View>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-around",
            margin: 20,
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 13, color: "gray", marginRight: 10 }}>
            {item.duration}
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() =>
              !isCurrentPlayingFile
                ? playSound(item.filepath, sound)
                : stopSound()
            }
          >
            {!isCurrentPlayingFile ? (
              <Feather name="play" size={24} color="green" />
            ) : (
              <FontAwesome name="stop-circle-o" size={24} color="green" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderHiddenItem = ({ item }, rowMap) => (
    <View style={{ flexDirection: "row" }}>
      <View style={styles.rowFront}>
        <TouchableOpacity
          style={styles.leftButton}
          onPress={() => viewContent(item.transcript)}
          activeOpacity={0.9}
        >
          <Text style={styles.actionButtonText}>Transcription</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.rowBack}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => deleteRecording(item.originalFilename)}
          activeOpacity={0.9}
        >
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: "green" }]}
          onPress={() => renameAudioFile(item.fileName, item.originalFilename)}
          activeOpacity={0.9}
        >
          <Text style={styles.actionButtonText}>Rename</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <>
      <SwipeListView
        useFlatList
        data={cloudRecordingList}
        renderItem={renderItem}
        keyExtractor={(item) => item.filepath}
        renderHiddenItem={renderHiddenItem}
        leftOpenValue={75}
        rightOpenValue={-75}
      />
      {/*console.log("CPS====>", currentPlayingStatus)*/}

      {currentPlayingStatus?.uri && !hasSoundStopped && (
        <>
          <View
            style={{
              backgroundColor: "green",
              height: "13%",
              width: "100%",
              flexDirection: "row",
              justifyContent: "flex-start",
              alignItems: "stretch",
            }}
          >
            <View
              style={{
                flexGrow: 1,
                justifyContent: "center",
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <TouchableOpacity
                style={styles.button}
                onPress={() => stopSound()}
              >
                <FontAwesome name="stop-circle-o" size={24} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.button}
                onPress={() => (hasSoundPaused ? resumeSound() : pauseSound())}
              >
                {hasSoundPaused ? (
                  <Feather name="play" size={24} color="white" />
                ) : (
                  <FontAwesome name="pause" size={24} color="white" />
                )}
              </TouchableOpacity>
            </View>
            <View style={{ flexGrow: 4, backgroundColor: "green" }}>
              <Slider
                style={{ width: "80%", height: "100%" }}
                minimumValue={0}
                maximumValue={durationMillis}
                step={1}
                value={slidingPosition}
                minimumTrackTintColor="gray"
                maximumTrackTintColor="gray"
                thumbTintColor="white"
                onSlidingStart={async () => {
                  await sound.pauseAsync();
                }}
                onSlidingComplete={async (val) => {
                  if (hasSoundPaused) {
                    await sound.setPositionAsync(val);
                  } else {
                    await sound.playFromPositionAsync(val);
                  }
                  dispatch(setSlidingPosition(val));
                  console.log("On Sliding Complete: ", val);
                }}
              />
            </View>
          </View>
          {
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                position: "absolute",
                bottom: 22,
                width: "100%",
              }}
            >
              <Text style={{ marginLeft: 75 }}>
                {msToTime(slidingPosition)}
              </Text>
              <Text
                style={{
                  marginRight: 20,
                }}
              >
                {msToTime(durationMillis - slidingPosition)}
              </Text>
            </View>
          }
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    flexDirection: "column",
    justifyContent: "center",
  },
  rowBack: {
    flex: 1,
    flexDirection: "column",
    alignItems: "flex-end",
    justifyContent: "center",
    paddingRight: 10,
  },
  rowFront: {
    flex: 1,
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "center",
    paddingRight: 10,
  },
  actionButton: {
    backgroundColor: "red",
    height: 28,
    width: 50,
    justifyContent: "center",
    alignItems: "center",
    margin: 3,
  },
  leftButton: {
    backgroundColor: "red",
    height: 28,
    width: 70,
    justifyContent: "center",
    alignItems: "center",
    margin: 3,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 10,
  },
});

export default Library;
