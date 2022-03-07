import { RecordingAudioTypes } from "./types";

// Action
export const updateRecordingList = (recordingList) => ({
  type: RecordingAudioTypes.UPDATE_RECORDING_LIST,
  payload: recordingList,
});

export const setSound = (sound) => ({
  type: RecordingAudioTypes.SET_SOUND,
  payload: sound,
});

export const setSoundPause = (hasPaused) => ({
  type: RecordingAudioTypes.SET_SOUND_PAUSE,
  payload: hasPaused,
});

export const setSoundStop = (hasStopped) => ({
  type: RecordingAudioTypes.SET_SOUND_STOPPED,
  payload: hasStopped,
});

export const setCurrentSoundPlaying = (currentSoundPlaying) => ({
  type: RecordingAudioTypes.SET_CURRENT_SOUND_PLAYING,
  payload: currentSoundPlaying,
});

export const setCurrentSoundRecording = (currentSoundRecording) => ({
  type: RecordingAudioTypes.SET_CURRENT_SOUND_RECORDING,
  payload: currentSoundRecording,
});

export const setCurrentPlayingStatus = (currentPlayingStatus) => ({
  type: RecordingAudioTypes.SET_CURRENT_PLAYING_STATUS,
  payload: currentPlayingStatus,
});

export const setDurationMillis = (durationMillis) => ({
  type: RecordingAudioTypes.SET_DURATION_MILLIS,
  payload: durationMillis,
});

export const setSlidingPosition = (slidingPosition) => ({
  type: RecordingAudioTypes.SET_SLIDING_POSITION,
  payload: slidingPosition,
});

export const setRecording = (recording) => ({
  type: RecordingAudioTypes.SET_RECORDING,
  payload: recording,
});

export const setIsRecording = (isRecording) => ({
  type: RecordingAudioTypes.SET_IS_RECORDING,
  payload: isRecording,
});

export const setRecordURI = (recordURI) => ({
  type: RecordingAudioTypes.SET_RECORD_URI,
  payload: recordURI,
});

export const setRecordingDuration = (recordingDuration) => ({
  type: RecordingAudioTypes.SET_RECORDING_DURATION,
  payload: recordingDuration,
});

export const setFileRenaming = (fileRenaming) => ({
  type: RecordingAudioTypes.SET_FILE_RENAMING,
  payload: fileRenaming,
});

export const setOriginalFilename = (originalFilename) => ({
  type: RecordingAudioTypes.SET_ORIGINAL_FILENAME,
  payload: originalFilename,
});

export const setDocID = (docID) => ({
  type: RecordingAudioTypes.SET_DOC_ID,
  payload: docID,
});