export type StateChangedEvent<TType extends string, TState extends string, TId> = {
  readonly type: TType;
  readonly id: TId;
  readonly from: TState;
  readonly to: TState;
  readonly actorId: string;
  readonly occurredAt: Date;
};
