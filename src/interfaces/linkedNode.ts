export interface LinkedNode<T> {
  key: string
  value: T
  ttl: number // Time to live in milliseconds
  prev?: LinkedNode<T>
  next?: LinkedNode<T>
}
