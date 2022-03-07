import * as React from "react";
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  ScrollView,
  Button,
} from "react-native";
import { useSelector } from "react-redux";
// import trainML's config code
import summarize_config from "../api/summarize_config";
import axios from "axios";

function Content(props) {
  const transcriptionText = useSelector(
    (state) => state.languageReducer.transcriptionText
  );

  const [summary, setSummary] = React.useState(null);

  const getSummary = async (transcript) => {
    if (transcript == null) {
      setSummary("Transcript is empty!");
      return;
    }
    try {
      const resp = await axios.post(
        `${summarize_config.api_address}${summarize_config.route_path}`,
        {
          transcript,
        }
      );
      const summary_text = resp.data["summary_text"];
      console.log(summary_text);
      //console.log(typeof summary_text);
      setSummary(summary_text);
    } catch (error) {
      if (error.response) {
        console.log(error.response.status);
        console.log(error.response);
      } else {
        console.log(error);
      }
    }
  };

  return (
    <SafeAreaView>
      <ScrollView>
        <View style={styles.container}>
          <Text>{transcriptionText}</Text>
          {/* uncomment the below when API is ready to use */}
          <Button
            title="Summarize"
            onPress={() => getSummary(transcriptionText)}
          />
          <Text>Summary is: {summary}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    height: "100%",
  },
});

export default Content;
