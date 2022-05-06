import * as ReactQuery from "react-query";
import { InfiniteQueryConfiguration, QueryResult } from "../libraries/queries";
import { useFetcher } from "./use-fetcher";

export const useInfiniteQuery = <I, P, O, E>(
  query: InfiniteQueryConfiguration<I, P, O, E>,
  input: I
): ReactQuery.UseInfiniteQueryResult<O, E> => {
  const fetcher = useFetcher();
  return ReactQuery.useInfiniteQuery<O, E, O>(
    query.getKey(input),
    async ({
      pageParam,
    }: ReactQuery.QueryFunctionContext<ReactQuery.QueryKey, P>) => {
      let result: QueryResult<O, E>;
      try {
        result = await query.fetchData(input, pageParam, fetcher);
      } catch (e) {
        result = await query.onError(e);
      }
      if ("success" in result) {
        return result.success;
      }
      throw result.fail;
    },
    {
      getNextPageParam: query.getNextPageParam,
      getPreviousPageParam: query.getPreviousPageParam,
    }
  );
};
