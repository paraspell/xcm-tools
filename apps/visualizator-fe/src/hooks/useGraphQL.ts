import { GraphQLClient } from "graphql-request";
import { type TypedDocumentNode } from "@graphql-typed-document-node/core";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { OperationDefinitionNode } from "graphql";

const endpoint = import.meta.env.VITE_API_URL;

export const graphQLClient = new GraphQLClient(endpoint);

type Strict<T> = T extends Record<string, never> ? undefined : NonNullable<T>;

export const useGraphQL = <ResultT, VariablesT>(
  document: TypedDocumentNode<ResultT, VariablesT>,
  variables?: Strict<VariablesT>
): UseQueryResult<ResultT> => {
  const operationName = (document.definitions[0] as OperationDefinitionNode)
    .name?.value;
  if (!operationName) {
    throw new Error(`Could not find operation name for document: ${document}`);
  }

  const queryKey = [operationName, variables] as const;
  return useQuery({
    queryKey,
    queryFn: async ({ queryKey }) => {
      return graphQLClient.request(document, queryKey[1]);
    },
  });
};
