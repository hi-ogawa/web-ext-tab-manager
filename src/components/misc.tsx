import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import React from "react";
import { Toaster } from "react-hot-toast";

export function CustomQueryClientProvider(
  props: React.PropsWithChildren<{ noDevTools?: boolean }>
) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            retry: 0,
          },
        },
      })
  );
  return (
    <QueryClientProvider client={queryClient}>
      {props.children}
      {!props.noDevTools && import.meta.env.DEV && <ReactQueryDevtools />}
    </QueryClientProvider>
  );
}

export function ToasterWrapper(props: React.PropsWithChildren) {
  return (
    <>
      <Toaster containerClassName="testid-toaster" />
      {props.children}
    </>
  );
}

// fallback image error (e.g. other extension's favicon is not available chrome-extension://paihieelminfnbelbkblkjagolhpnipi/assets/icon-32.png)
export function ImgWithFallback(
  props: JSX.IntrinsicElements["img"] & { fallback: React.ReactElement }
) {
  const [error, setError] = React.useState<unknown>();
  const { fallback, ...imgProps } = props;
  return error ? (
    props.fallback
  ) : (
    <img {...imgProps} onError={(e) => setError(e)} />
  );
}
