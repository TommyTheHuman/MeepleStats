export function LoginPageLoader() {
  const loggedIn = localStorage.getItem("loggedIn") === "true";

  if (loggedIn) {
    throw new Response("Not Found", { status: 404 });
  }

  return true;
}