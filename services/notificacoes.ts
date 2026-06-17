import Constants from "expo-constants";

import * as Device from "expo-device";

import * as Notifications from "expo-notifications";

import {
  Platform,
} from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function obterProjectId() {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ||
    Constants.easConfig?.projectId ||
    ""
  );
}

export async function solicitarPermissaoNotificacoes() {
  try {
    if (!Device.isDevice) {
      return "";
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync(
        "mensagens",
        {
          name: "Mensagens",
          importance:
            Notifications.AndroidImportance.MAX,
          vibrationPattern: [
            0,
            250,
            250,
            250,
          ],
          lightColor: "#1E3A8A",
          sound: "default",
        }
      );
    }

    const permissaoAtual =
      await Notifications.getPermissionsAsync();

    let statusFinal =
      permissaoAtual.status;

    if (
      statusFinal !==
      "granted"
    ) {
      const novaPermissao =
        await Notifications.requestPermissionsAsync();

      statusFinal =
        novaPermissao.status;
    }

    if (
      statusFinal !==
      "granted"
    ) {
      return "";
    }

    const projectId =
      obterProjectId();

    if (!projectId) {
      return "";
    }

    const token =
      await Notifications.getExpoPushTokenAsync({
        projectId,
      });

    return token.data;
  } catch {
    return "";
  }
}

export async function notificarMensagemLocal(
  titulo: string,
  corpo: string
) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: titulo,
        body: corpo,
        sound: "default",
        badge: 1,
        data: {
          tipo: "mensagem",
        },
      },
      trigger: null,
    });
  } catch {}
}