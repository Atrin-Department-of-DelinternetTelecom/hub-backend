import { Lemon } from '@del-internet/lemon';
import { get as config } from '@config';

export const lemon = new Lemon({
  username: config('index.lemon.username', 'without username'),
  password: config('index.lemon.password', 'without password'),
});
