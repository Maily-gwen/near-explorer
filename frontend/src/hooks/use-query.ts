import * as ReactQuery from "react-query";
import { QueryConfiguration, QueryResult } from "../libraries/queries";
import { useFetcher } from "./use-fetcher";

export const useQuery = <I, O, E>(
  query: QueryConfiguration<I, O, E>,
  input: I
): ReactQuery.UseQueryResult<O, E> => {
  const fetcher = useFetcher();
  return ReactQuery.useQuery<O, E, O>(query.getKey(input), async () => {
    let result: QueryResult<O, E>;
    try {
      result = await query.fetchData(input, fetcher);
    } catch (e) {
      result = await query.onError(e);
    }
    if ("success" in result) {
      return result.success;
    }
    throw result.fail;
  });
};
