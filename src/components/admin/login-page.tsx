import { useEffect, useMemo, useState } from "react";
import { Form, required, useLogin, useNotify } from "ra-core";
import type { SubmitHandler, FieldValues } from "react-hook-form";
import { useLocation } from "react-router";
import { Button } from "@/components/ui/button";
import { TextInput } from "@/components/admin/text-input";
import { Notification } from "@/components/admin/notification";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";

export const LoginPage = (props: { redirectTo?: string }) => {
  const { redirectTo } = props;
  const location = useLocation();
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const invitationToken = searchParams.get("invitation") ?? undefined;
  const invitationEmail = searchParams.get("email") ?? undefined;

  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(Boolean(invitationToken));
  const login = useLogin();
  const notify = useNotify();
  const convexClient = useMemo(() => {
    if (!import.meta.env.VITE_CONVEX_URL) {
      throw new Error("VITE_CONVEX_URL is not defined");
    }
    return new ConvexHttpClient(import.meta.env.VITE_CONVEX_URL);
  }, []);

  useEffect(() => {
    if (invitationToken) {
      setIsSignUp(true);
    }
  }, [invitationToken]);

  const handleSubmit: SubmitHandler<FieldValues> = async (values) => {
    setLoading(true);
    const email = (values.email as string).trim().toLowerCase();
    const password = values.password as string;
    const name = values.name as string | undefined;
    const companyName = values.companyName as string | undefined;

    if (isSignUp && !invitationToken && !companyName) {
      notify("Please provide your company name", { type: "warning" });
      setLoading(false);
      return;
    }
    try {
      if (isSignUp) {
        await convexClient.action(api.auth.signUp, {
          email,
          password,
          name: name ?? email,
          companyName: !invitationToken ? companyName : undefined,
          invitationToken,
        });
      }
      await login({ email, password }, redirectTo);
    } catch (error) {
      const fallback = isSignUp ? "auth.sign_up_error" : "ra.auth.sign_in_error";
      let message = fallback;
      if (typeof error === "string") {
        message = error;
      } else if (error && typeof (error as { body?: { message?: string } }).body?.message === "string") {
        message = (error as { body?: { message?: string } }).body!.message as string;
      } else if (error instanceof Error && error.message) {
        message = error.message;
      }
      notify(message, {
        type: "error",
        messageArgs: { _: message },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="container relative grid flex-col items-center justify-center sm:max-w-none lg:grid-cols-2 lg:px-0">
        <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
          <div className="absolute inset-0 bg-zinc-900" />
          <div className="relative z-20 flex items-center text-lg font-medium">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-2 h-6 w-6"
            >
              <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
            </svg>
            Acme Inc
          </div>
          <div className="relative z-20 mt-auto">
            <blockquote className="space-y-2">
              <p className="text-lg">
                &ldquo;Shadcn Admin Kit has allowed us to quickly create and
                evolve a powerful tool that otherwise would have taken months of
                time and effort to develop.&rdquo;
              </p>
              <footer className="text-sm">John Doe</footer>
            </blockquote>
          </div>
        </div>
        <div className="lg:p-8">
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
            <div className="flex flex-col space-y-2 text-center">
              <h1 className="text-2xl font-semibold tracking-tight">
                {isSignUp ? "Create an account" : "Sign in"}
              </h1>
              <p className="text-sm leading-none text-muted-foreground">
                {isSignUp
                  ? invitationToken
                    ? "Finish creating your HavenHost account to join your company."
                    : "Fill in your details to create your HavenHost admin account."
                  : "Enter your email address and password to continue."}
              </p>
            </div>
            <Form
              className="space-y-8"
              onSubmit={handleSubmit}
              defaultValues={{
                email: invitationEmail,
              }}
            >
              {isSignUp ? (
                <TextInput
                  label="Name"
                  source="name"
                  validate={required()}
                  placeholder="Jane Doe"
                />
              ) : null}
              <TextInput
                label="Email"
                source="email"
                type="email"
                validate={required()}
                helperText={
                  invitationToken
                    ? "Use the same email address that received the invitation."
                    : undefined
                }
              />
              {isSignUp && !invitationToken ? (
                <TextInput
                  label="Company Name"
                  source="companyName"
                  validate={required()}
                  placeholder="Acme Co"
                />
              ) : null}
              <TextInput
                label="Password"
                source="password"
                type="password"
                validate={required()}
              />
              <Button
                type="submit"
                className="cursor-pointer"
                disabled={loading}
              >
                {loading
                  ? isSignUp
                    ? "Creating account..."
                    : "Signing in..."
                  : isSignUp
                    ? "Create account"
                    : "Sign in"}
              </Button>
            </Form>
            <p className="text-sm text-muted-foreground text-center">
              {isSignUp ? "Already have an account?" : "Need an account?"}
              <Button
                type="button"
                variant="link"
                className="px-2"
                onClick={() => setIsSignUp((prev) => !prev)}
                disabled={loading || Boolean(invitationToken)}
              >
                {isSignUp ? "Sign in" : "Create one"}
              </Button>
            </p>
          </div>
        </div>
      </div>
      <Notification />
    </div>
  );
};
