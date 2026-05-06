export async function enviarNotificacao(
  pushToken: string,
  titulo: string,
  mensagem: string
) {
  await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: pushToken,
      sound: "default",
      title: titulo,
      body: mensagem,
    }),
  });
}
