import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Input } from "react-native-elements";
import { KeyboardAvoidingView } from "react-native";
import { useDispatch } from "react-redux";
import { StatusBar } from "expo-status-bar";
import { auth } from "../../firebase";
import { LogBox } from "react-native";
import { setCurrentUser } from "../redux/user/actions";
import { onAuthStateChanged, signInWithEmailAndPassword } from "firebase/auth";
import { Text, useTheme } from "react-native-elements";

const Login = ({ navigation }) => {
  const { theme } = useTheme();
  const dispatch = useDispatch();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      console.log(authUser); // uid
      if (authUser) {
        dispatch(setCurrentUser(authUser));
        navigation.replace("Home");
      }
    });

    return unsubscribe;
  }, []);

  const signIn = () => {
    LogBox.ignoreLogs(["Setting a timer"]);
    signInWithEmailAndPassword(auth, email, password).catch((error) =>
      alert(error)
    );
  };

  return (
    <>
      <StatusBar style="light" />
      <KeyboardAvoidingView behavior="padding" style={styles.container}>
        <View style={styles.inputContainer}>
          <Input
            placeholder="Email"
            autoFocus
            type="email"
            value={email}
            onChangeText={(text) => setEmail(text)}
          />
          <Input
            placeholder="Password"
            secureTextEntry
            type="password"
            value={password}
            onChangeText={(text) => setPassword(text)}
            onSubmitEditing={signIn}
          />
        </View>
      </KeyboardAvoidingView>
      <View
        style={{
          justifyContent: "center",
          alignItems: "center",
          flex: 1,
          paddingTop: 15,
          backgroundColor: "white",
        }}
      >
        <Button
          containerStyle={styles.button}
          onPress={signIn}
          buttonStyle={{
            backgroundColor: "rgba(111, 102, 186, 1)",
            borderRadius: 5,
          }}
          title="Login"
        />
        <View style={{ height: 100 }} />
      </View>
    </>
  );
};

export default Login;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    backgroundColor: "white",
  },
  inputContainer: {
    width: 300,
  },
  button: {
    width: 200,
    marginTop: 10,
  },
  text: {
    textAlign: "center",
    padding: 5,
  },
});
