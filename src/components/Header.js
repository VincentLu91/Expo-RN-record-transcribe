import * as React from "react";
import { StyleSheet, View, Text } from "react-native";

function Header(props) {
  return <View style={styles.container}></View>;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    height: "10%",
    borderBottomColor: "gray",
    borderBottomWidth: 2,
    textAlign: "center",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default Header;
