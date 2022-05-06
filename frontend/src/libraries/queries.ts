import { ParsedUrlQuery } from "querystring";
import * as ReactQuery from "react-query";
import { getNearNetwork } from "./config";
import { timeout } from "./promise";
import { Fetcher, getFetcher } from "./transport";

export type QueryResult<S, F> = { success: S } | { fail: F };

export type QueryConfiguration<I, O, E> = {
  getKey: (input: I) => ReactQuery.QueryKey;
  fetchData: (input: I, fetcher: Fetcher) => Promise<QueryResult<O, E>>;
  onError: (error: unknown) => Promise<QueryResult<O, E>>;
};

export const createServerQueryClient = (): ReactQuery.QueryClient => {
  return new ReactQuery.QueryClient({
    defaultOptions: {
      queries: {
        retry: 0,
      },
    },
  });
};

export const SERVER_PREFETCH_TIMEOUT = 1000;

export const serverPrefetchTimeout = <T>(
  fn: () => Promise<T>
): (() => Promise<T>) => {
  return () => Promise.race([fn(), timeout<T>(SERVER_PREFETCH_TIMEOUT)]);
};

export const successful = <S, F>(result: S): QueryResult<S, F> => ({
  success: result,
});
export const failed = <S, F>(result: F): QueryResult<S, F> => ({
  fail: result,
});

export type PrefetchObject = {
  fetch: <I>(
    query: QueryConfiguration<I, unknown, unknown>,
    input: I
  ) => Promise<void>;
  getDehydratedState: () => ReactQuery.DehydratedState;
};

export const getPrefetchObject = (
  queryClient: ReactQuery.QueryClient,
  parsedQuery: ParsedUrlQuery,
  hostname?: string
): PrefetchObject => ({
  fetch: (query, input) =>
    queryClient.prefetchQuery(
      query.getKey(input),
      serverPrefetchTimeout(async () => {
        let result: QueryResult<unknown, unknown>;
        try {
          const fetcher = getFetcher(getNearNetwork(parsedQuery, hostname));
          result = await query.fetchData(input, fetcher);
        } catch (e) {
          result = await query.onError(e);
        }
        if ("success" in result) {
          return result.success;
        }
        throw result.fail;
      })
    ),
  getDehydratedState: () => ReactQuery.dehydrate(queryClient),
});
