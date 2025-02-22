import type { DocumentNode, OperationTypeNode } from 'graphql'
import {
  ResponseResolver,
  RequestHandlerOptions,
} from './handlers/RequestHandler'
import {
  GraphQLHandler,
  GraphQLVariables,
  ExpectedOperationTypeNode,
  GraphQLHandlerNameSelector,
  GraphQLResolverExtras,
  GraphQLResponseBody,
} from './handlers/GraphQLHandler'
import type { Path } from './utils/matching/matchRequestUrl'

export interface TypedDocumentNode<
  Result = { [key: string]: any },
  Variables = { [key: string]: any },
> extends DocumentNode {
  __apiType?: (variables: Variables) => Result
  __resultType?: Result
  __variablesType?: Variables
}

function createScopedGraphQLHandler(
  operationType: ExpectedOperationTypeNode,
  url: Path,
) {
  return <
    Query extends Record<string, any>,
    Variables extends GraphQLVariables = GraphQLVariables,
  >(
    operationName:
      | GraphQLHandlerNameSelector
      | DocumentNode
      | TypedDocumentNode<Query, Variables>,
    resolver: ResponseResolver<
      GraphQLResolverExtras<Variables>,
      null,
      GraphQLResponseBody<Query>
    >,
    options: RequestHandlerOptions = {},
  ) => {
    return new GraphQLHandler(
      operationType,
      operationName,
      url,
      resolver,
      options,
    )
  }
}

function createGraphQLOperationHandler(url: Path) {
  return <
    Query extends Record<string, any>,
    Variables extends GraphQLVariables = GraphQLVariables,
  >(
    resolver: ResponseResolver<
      GraphQLResolverExtras<Variables>,
      null,
      GraphQLResponseBody<Query>
    >,
  ) => {
    return new GraphQLHandler('all', new RegExp('.*'), url, resolver)
  }
}

const standardGraphQLHandlers = {
  /**
   * Intercepts a GraphQL query by a given name.
   *
   * @example
   * graphql.query('GetUser', () => {
   *   return HttpResponse.json({ data: { user: { name: 'John' } } })
   * })
   *
   * @see {@link https://mswjs.io/docs/api/graphql#graphqlqueryqueryname-resolver `graphql.query()` API reference}
   */
  query: createScopedGraphQLHandler('query' as OperationTypeNode, '*'),

  /**
   * Intercepts a GraphQL mutation by its name.
   *
   * @example
   * graphql.mutation('SavePost', () => {
   *   return HttpResponse.json({ data: { post: { id: 'abc-123 } } })
   * })
   *
   * @see {@link https://mswjs.io/docs/api/graphql#graphqlmutationmutationname-resolver `graphql.query()` API reference}
   *
   */
  mutation: createScopedGraphQLHandler('mutation' as OperationTypeNode, '*'),

  /**
   * Intercepts any GraphQL operation, regardless of its type or name.
   *
   * @example
   * graphql.operation(() => {
   *   return HttpResponse.json({ data: { name: 'John' } })
   * })
   *
   * @see {@link https://mswjs.io/docs/api/graphql#graphloperationresolver `graphql.operation()` API reference}
   */
  operation: createGraphQLOperationHandler('*'),
}

function createGraphQLLink(url: Path): typeof standardGraphQLHandlers {
  return {
    operation: createGraphQLOperationHandler(url),
    query: createScopedGraphQLHandler('query' as OperationTypeNode, url),
    mutation: createScopedGraphQLHandler('mutation' as OperationTypeNode, url),
  }
}

/**
 * A namespace to intercept and mock GraphQL operations
 *
 * @example
 * graphql.query('GetUser', resolver)
 * graphql.mutation('DeletePost', resolver)
 *
 * @see {@link https://mswjs.io/docs/api/graphql `graphql` API reference}
 */
export const graphql = {
  ...standardGraphQLHandlers,

  /**
   * Intercepts GraphQL operations scoped by the given URL.
   *
   * @example
   * const github = graphql.link('https://api.github.com/graphql')
   * github.query('GetRepo', resolver)
   *
   * @see {@link https://mswjs.io/docs/api/graphql#graphqllinkurl `graphql.link()` API reference}
   */
  link: createGraphQLLink,
}
