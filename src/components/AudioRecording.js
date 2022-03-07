import * as React from "react";
import {
  View,
  TouchableOpacity,
  TextInput,
  Text,
  AppState,
  SafeAreaView,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Audio } from "expo-av";
import { useDispatch, useSelector } from "react-redux";
import {
  updateRecordingList,
  setCurrentSoundRecording,
  setCurrentPlayingStatus,
  setRecording,
  setIsRecording,
  setRecordURI,
  setRecordingDuration,
} from "../redux/recording/actions";
import moment from "moment";
import { MaterialIcons } from "@expo/vector-icons";
import Chronometer from "./Chronometer";
import db, { storage } from "../../firebase";
import { uploadBytes, ref } from "firebase/storage";
import { collection, addDoc, query, getDocs } from "firebase/firestore";
import LiveAudioStream from "react-native-live-audio-stream";

//let socket;
global.socket;
Audio.setAudioModeAsync({
  staysActiveInBackground: true,
  shouldDuckAndroid: true,
  interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
  playThroughEarpieceAndroid: true,
});

function AudioRecording(props) {
  const { navigation } = props;
  const appState = React.useRef(AppState.currentState);
  const [appStateVisible, setAppStateVisible] = React.useState(
    appState.current
  );

  const [filename, setFilename] = React.useState("");
  const [transcript, setTranscript] = React.useState("");
  const subscriptionAppState = React.useRef();
  const dispatch = useDispatch();
  const recordingList = useSelector(
    (state) => state.recordingAudioReducer.recordingList
  );
  const currentSoundPlaying = useSelector(
    (state) => state.recordingAudioReducer.currentSoundPlaying
  );
  const recording = useSelector(
    (state) => state.recordingAudioReducer.recording
  );
  const isRecording = useSelector(
    (state) => state.recordingAudioReducer.isRecording
  );
  const recordURI = useSelector(
    (state) => state.recordingAudioReducer.recordURI
  );
  const recordingDuration = useSelector(
    (state) => state.recordingAudioReducer.recordingDuration
  );
  const currentUser = useSelector((state) => state.user.currentUser);

  const getCurrentDuration = async () => {
    if (recording) {
      const { durationMillis } = await recording.getStatusAsync();
      dispatch(setRecordingDuration(durationMillis));
    }
  };

  const options = {
    sampleRate: 16000, // default is 44100 but 32000 is adequate for accurate voice recognition
    channels: 1, // 1 or 2, default 1
    bitsPerSample: 16, // 8 or 16, default 16
    audioSource: 6, // android only (see below)
    bufferSize: 4096, // default is 2048
  };

  const uploadAudio = async (audioData) => {
    const uriParts = recordURI.split(".");
    const fileType = uriParts[uriParts.length - 1];
    const fileName =
      audioData.filename + "_" + currentUser.uid + `${Date.now()}.${fileType}`;
    audioData.originalFilename = fileName;
    console.log("FILE NAME", fileName);
    audioData.fileName = fileName;

    //delete filename
    delete audioData.filename;

    try {
      const blob = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = () => {
          try {
            resolve(xhr.response);
          } catch (error) {
            console.log("error:", error);
          }
        };
        xhr.onerror = (e) => {
          console.log(e);
          reject(new TypeError("Network request failed"));
        };
        xhr.responseType = "blob";
        xhr.open("GET", recordURI, true);
        xhr.send(null);
      });
      if (blob != null) {
        const storageRef = ref(storage, fileName);
        uploadBytes(storageRef, blob).then((snapshot) => {
          // add loading while get data!!!
          addDoc(
            //collection(db, `customers/${userContext.user.uid}/checkout_sessions`),
            //collection(db, `customers/${user.uid}/checkout_sessions`),
            collection(db, `recordings/${currentUser.uid}/files`),
            audioData
          );
          navigation.navigate("Library");
          console.log("snapshot is: ", snapshot);
        });
      } else {
        console.log("erroor with blob");
      }
    } catch (error) {
      console.log("error:", error);
    }
  };

  React.useEffect(() => {
    subscriptionAppState.current = AppState.addEventListener(
      "change",
      (nextAppState) => {
        appState.current = nextAppState;
        setAppStateVisible(appState.current);
      }
    );

    if (appStateVisible === "active") {
      getCurrentDuration();
    }

    // Cleanup function
    return () => subscriptionAppState.current?.remove();
  }, [appStateVisible]);

  async function startRecording() {
    try {
      // Stop current playing sound; if any
      if (currentSoundPlaying) {
        await currentSoundPlaying.unloadAsync();
      }

      console.log("Requesting permissions..");
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      console.log("Starting recording..");
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(
        Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
      );
      await recording.startAsync();
      startTranscribing();
      dispatch(setRecording(recording));
      dispatch(setIsRecording(true));
      dispatch(setCurrentSoundRecording(recording));
      console.log("Recording started");
    } catch (err) {
      console.error("Failed to start recording", err);
      dispatch(setIsRecording(false));
    }
  }

  async function startTranscribing() {
    setTranscript(null); // in the beginning, don't show the previous transcript. Socket delay messages...
    LiveAudioStream.init(options);
    // if you see "Network request failed", it's because the device IP in the fetch() call is expired
    // run ifconfig to get the new device IP
    const response = await fetch("http://192.168.2.19:5001"); // get temp session token from server.js (backend)
    const data = await response.json();
    console.log("DATOKEN", data);
    if (data.error) {
      alert(data.error);
    }

    const { token } = data;

    if (!global.socket) {
      // establish wss with AssemblyAI (AAI) at 16000 sample rate
      global.socket = await new WebSocket(
        `wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000&token=${token}`
      );
    }

    // handle incoming messages to display transcription to the DOM
    const texts = {};
    global.socket.onmessage = (message) => {
      console.log("Entering onmessage");
      console.log("onsocket message is: ", message);
      let msg = "";
      const res = JSON.parse(message.data);
      texts[res.audio_start] = res.text;
      const keys = Object.keys(texts);
      keys.sort((a, b) => a - b);
      for (const key of keys) {
        if (texts[key]) {
          msg += ` ${texts[key]}`;
        }
      }
      console.log("Leaving onmessage. msg is: ", msg);
      setTranscript(msg);
    };

    global.socket.onerror = (event) => {
      console.error(event);
      //global.socket.close();
    };

    global.socket.onclose = (event) => {
      console.log("Closing Socket event: ", event);
      global.socket = null;
    };

    LiveAudioStream.start();
    global.socket.onopen = () => {
      LiveAudioStream.on("data", (data) => {
        try {
          if (global.socket) {
            global.socket.send(JSON.stringify({ audio_data: data }));
          }
        } catch (error) {
          console.log("Catching Error with sending message to socket: ", error);
        }
      });
    };
  }

  async function stopRecording() {
    LiveAudioStream.stop();
    console.log("Stopping recording..");
    dispatch(setCurrentPlayingStatus(null));
    dispatch(setRecording(undefined));
    dispatch(setIsRecording(false));
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    dispatch(setRecordURI(uri));

    // once recording stops, reset current duration back to 0
    dispatch(setRecordingDuration(0));
    console.log("Recording stopped and stored at", uri);
  }

  async function renameRecord() {
    if (!filename && filename.length < 1) {
      alert("Filename can not be empty!");
      return;
    }

    const { sound } = await Audio.Sound.createAsync({ uri: recordURI });
    const result = await sound.getStatusAsync();
    const durationMillis = result.durationMillis;
    const momentduration = moment.duration(durationMillis);
    let duration = moment
      .utc(momentduration.as("milliseconds"))
      .format("HH:mm:ss");
    if (momentduration.hours() == 0) {
      duration = moment.utc(momentduration.as("milliseconds")).format("mm:ss");
    }
    const recordingdate = moment().format("MMMM Do YYYY");
    const newRecordingList = [...recordingList];
    newRecordingList.push({
      filepath: recordURI,
      filename,
      recordingdate: recordingdate,
      duration: duration,
      transcript: transcript,
    });

    //newRecordingList.reverse()   //sorting
    //props.setRecordinglistProp(newRecordingList);
    dispatch(updateRecordingList(newRecordingList));
    const audioData = {
      user: currentUser.uid,
      filename,
      recordingdate: recordingdate,
      duration: duration,
      transcript: transcript,
    };
    uploadAudio(audioData);

    // Reset the field
    setFilename("");
    dispatch(setRecordURI(null));

    // We can go to library tab
    setTranscript(null); // to ensure previous transcript doesn't display.
  }

  function renderView() {
    if (recording && isRecording) {
      return (
        <View style={styles.contentContainer}>
          <Text>{transcript}</Text>
          <TouchableOpacity onPress={stopRecording}>
            <MaterialIcons name="stop" size={120} color="black" />
          </TouchableOpacity>
          <Chronometer currentDuration={recordingDuration} />
        </View>
      );
    }
    if (!isRecording && !recordURI) {
      return (
        <View style={styles.contentContainer}>
          <TouchableOpacity onPress={startRecording}>
            <MaterialIcons name="keyboard-voice" size={120} color="black" />
          </TouchableOpacity>
        </View>
      );
    }
    if (!isRecording && recordURI) {
      return (
        <View style={styles.contentContainer}>
          <Text>Enter the name of the recording below</Text>
          <TextInput
            placeholder="audio name"
            onChangeText={(text) => setFilename(text)}
            style={{ borderWidth: 1, padding: 8, height: 45, width: 180 }}
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
            onPress={renameRecord}
          >
            <Text style={{ color: "#fff", textAlign: "center" }}>Rename</Text>
          </TouchableOpacity>
        </View>
      );
    }
  }

  return (
    <SafeAreaView>
      <ScrollView>{renderView()}</ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    //flexDirection: "row",
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default AudioRecording;
