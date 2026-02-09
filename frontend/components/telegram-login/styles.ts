import { StyleSheet } from "react-native";

export const loginStyles = StyleSheet.create({
  input: {
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(128,128,128,0.1)",
    paddingHorizontal: 16,
    fontSize: 16,
  },
  button: {
    height: 48,
    borderRadius: 12,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  linkButton: {
    alignItems: "center",
    paddingVertical: 8,
  },
});
