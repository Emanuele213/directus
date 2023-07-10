import type { AbstractQueryNodeSortTargets } from '@directus/data';
import type { GeoJSONGeometry } from 'wellknown';

export interface AbstractSqlQueryColumn {
	table: string;
	column: string;
}

export interface AbstractSqlQuerySelectNode extends AbstractSqlQueryColumn {
	type: 'primitive';

	/* This can only be applied when using the function it within the SELECT clause */
	as?: string;
}

export interface AbstractSqlQueryFnNode {
	type: 'fn';

	/* Same as the the abstract functions @todo: add restrictions */
	fn: string;

	field: AbstractSqlQuerySelectNode;

	isTimestampType?: boolean;

	/* Indexes of additional arguments within the parameter list  */
	arguments?: ValuesNode;

	/* This can only be applied when using the function it within the SELECT clause */
	as?: string;
}

/** @TODO */
// export interface SqlStatementSelectJson {
// 	type: 'json';
// 	table: string;
// 	column: string;
// 	as?: string;
// 	path: string;
// }

/**
 * Used for parameterized queries.
 */
type ParameterIndex = {
	/** Indicates where the actual value is stored in the parameter array */
	parameterIndex: number;
};

/**
 * This is an abstract SQL query which can be passed to all SQL drivers.
 *
 * @example
 * ```ts
 * const query: SqlStatement = {
 *  select: [id],
 *  from: 'articles',
 *  limit: 0,
 * 	parameters: [25],
 * };
 * ```
 */
export interface AbstractSqlQuery {
	type: 'query';
	root?: boolean;
	select: (AbstractSqlQuerySelectNode | AbstractSqlQueryFnNode)[];
	from: string;
	join?: AbstractSqlQueryJoinNode[];
	limit?: ParameterIndex;
	offset?: ParameterIndex;
	order?: AbstractSqlQueryOrderNode[];
	where?: AbstractSqlQueryConditionNode | AbstractSqlQueryLogicalNode;
	parameters: ParameterTypes[];
	/**
	 * SQL returns data as a flat object. This map contains the flat property names and the JSON path
	 * they correspond to.
	 */
	paths: Map<string, string[]>;
}

export type ParameterTypes = string | boolean | number | GeoJSONGeometry;

/**
 * All nodes which can be used within the `nodes` array of the `AbstractQuery` have a type attribute.
 * With this in place it can easily be determined how to technically handle this field.
 * @see `AbstractQueryNodeType` for all possible types.
 */
interface AbstractSqlQueryNode {
	/** the type of the node */
	type: string;
}

export interface AbstractSqlQueryOrderNode extends AbstractSqlQueryNode {
	type: 'order';
	orderBy: AbstractQueryNodeSortTargets;
	direction: 'ASC' | 'DESC';
}

export interface AbstractSqlQueryJoinNode extends AbstractSqlQueryNode {
	type: 'join';
	table: string;
	on: SqlJoinConditionNode | AbstractSqlQueryLogicalNode;
	as: string;
}

type ConditionNodeBase = {
	target: any;
	operation: string;
	compareTo: any;
} & AbstractSqlQueryNode;

export interface SqlJoinConditionNode extends ConditionNodeBase {
	type: 'join-condition';
	target: AbstractSqlQuerySelectNode;
	compareTo: AbstractSqlQuerySelectNode;
}

export interface SqlLetterConditionNode extends ConditionNodeBase {
	type: 'letter-condition';
	target: AbstractSqlQuerySelectNode;
	operation: 'contains' | 'starts_with' | 'ends_with' | 'eq';
	compareTo: ValueNode;
	negate: boolean;
}

export interface SqlNumberConditionNode extends ConditionNodeBase {
	type: 'number-condition';
	target: AbstractSqlQuerySelectNode | AbstractSqlQueryFnNode;
	operation: 'eq' | 'lt' | 'lte' | 'gt' | 'gte';
	compareTo: ValueNode;
	negate: boolean;
}

export interface SqlSetConditionNode extends ConditionNodeBase {
	type: 'set-condition';
	operation: 'eq' | 'lt' | 'lte' | 'gt' | 'gte' | 'in';
	compareTo: ValuesNode | AbstractSqlQuery;
	negate: boolean;
}

export interface SqlGeoConditionNode extends ConditionNodeBase {
	type: 'geo-condition';
	target: AbstractSqlQuerySelectNode;
	operation: 'intersects' | 'intersects_bbox';
	compareTo: ValueNode;
	negate: boolean;
}

export type AbstractSqlQueryConditionNode =
	| SqlLetterConditionNode
	| SqlNumberConditionNode
	| SqlSetConditionNode
	| SqlGeoConditionNode;

export type CompareToNodeTypes = ValueNode | AbstractSqlQuerySelectNode | AbstractSqlQuery;

export interface AbstractSqlQueryLogicalNode extends AbstractSqlQueryNode {
	type: 'logical';
	operator: 'and' | 'or';
	negate: boolean;
	childNodes: (AbstractSqlQueryConditionNode | AbstractSqlQueryLogicalNode)[];
}

export interface ValueNode {
	type: 'value';
	parameterIndex: number;
}

export interface ValuesNode {
	type: 'values';
	parameterIndexes: number[];
}

/**
 * An actual vendor specific SQL statement with its parameters.
 * @example
 * ```
 * {
 * 		statement: 'SELECT * FROM "articles" WHERE "articles"."id" = $1;',
 * 		values: [99],
 * }
 * ```
 */
export interface ParameterizedSqlStatement {
	statement: string;
	parameters: (string | number | boolean)[];
}
