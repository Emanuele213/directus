import type { AbstractSqlQueryConditionNode, AbstractSqlQueryLogicalNode } from '@directus/data-sql';
import { getComparison } from '../utils/get-comparison.js';
import { convertGeoFn, convertDateTimeFn } from './functions.js';
import { wrapColumn } from './wrap-column.js';

export const conditionString = (where: AbstractSqlQueryConditionNode | AbstractSqlQueryLogicalNode): string => {
	if (where.type === 'condition') {
		const comparison = getComparison(where.operation, where.compareTo, where.negate);

		if (where.target.type === 'fn') {
			const wrappedColumn = wrapColumn(where.target.input.table, where.target.input.column);

			if (where.operation === 'intersects') {
				return convertGeoFn(where, wrappedColumn);
			}

			return `${convertDateTimeFn(where.target, wrappedColumn)} ${comparison}`;
		}

		const wrappedColumn = wrapColumn(where.target.table, where.target.column);
		return `${wrappedColumn} ${comparison}`;
	}

	// the node is a logical node
	const logicalGroup = where.childNodes
		.map((childNode) =>
			childNode.type === 'condition' || childNode.negate
				? conditionString(childNode)
				: `(${conditionString(childNode)})`
		)
		.join(where.operator === 'and' ? ' AND ' : ' OR ');

	return where.negate ? `NOT (${logicalGroup})` : logicalGroup;
};