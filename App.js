import "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import React, { Component } from "react";
import { StyleSheet, Text, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { Provider } from "react-redux";
import store from "./src/redux/";
import Login from "./src/components/Login";
import Home from "./src/components/Home";
import Logout from "./src/components/Logout";
import Content from "./src/components/Content";
import RenameForm from "./src/components/RenameForm";
import DeleteRecording from "./src/components/DeleteRecording";
import { createNavigationContainerRef } from "@react-navigation/native";
import { LogBox } from "react-native";

// Ignore log notification by message
LogBox.ignoreLogs(["Warning: ..."]);

//Ignore all log notifications
LogBox.ignoreAllLogs();

const Stack = createStackNavigator();

export const navigationRef = createNavigationContainerRef();

const globalScreenOptions = {
  headerStyle: { backgroundColor: "#2C6BED" },
  headerTitleStyle: { color: "white" },
  headerTintColor: "white",
};

export default function App() {
  {
    /* make sure dispatch and useSelector variables are defined within the Provider component or in another component wrapped by provider */
  }
  return (
    <Provider store={store}>
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator screenOptions={globalScreenOptions}>
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="Content" component={Content} />
          <Stack.Screen name="RenameForm" component={RenameForm} />
          <Stack.Screen name="DeleteRecording" component={DeleteRecording} />
          <Stack.Screen
            name="Home"
            component={Home}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Logout"
            component={Logout}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
