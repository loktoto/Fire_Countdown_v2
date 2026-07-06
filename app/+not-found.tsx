import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function NotFound() {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>Route not found</Text>
      <Link href="/(tabs)/log" style={styles.link}>
        Go to Log
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#090A0F",
  },
  title: {
    color: "#FFFFFF",
    fontSize: 20,
  },
  link: {
    color: "#00F0FF",
    marginTop: 12,
  },
});
