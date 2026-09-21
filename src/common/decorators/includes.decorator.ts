import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import {
  filterAllowedIncludes,
  parseIncludes,
} from '../query/include-parser';

/**
 * Parameter decorator to extract and validate requested relation inclusions.
 *
 * Example:
 * ```ts
 * @Get()
 * findAll(
 *   @CurrentUser() user: AuthUser,
 *   @Includes(['customer', 'technician', 'site', 'asset', 'attachments']) includes: string[],
 * )
 * ```
 */
export const Includes = createParamDecorator(
  (allowedRelations: string[] | undefined, ctx: ExecutionContext): string[] => {
    const request = ctx.switchToHttp().getRequest();
    const raw = request.query?.include ?? request.query?.includes;
    const parsed = parseIncludes(raw);

    if (allowedRelations && allowedRelations.length > 0) {
      return filterAllowedIncludes(parsed, allowedRelations);
    }

    return parsed;
  },
);
