/**
 * Empty body — no fields are required to create a game.
 *
 * NOTE: do not add an `unused?: never` placeholder here. Decorating a
 * `never`-typed property with `@ApiProperty*` makes @nestjs/swagger try
 * to resolve the type and throws "A circular dependency has been
 * detected (property key: 'unused')" at bootstrap.
 */
export class CreateGameDto {}
