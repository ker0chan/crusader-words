class Word
{
  constructor(x, y, number, direction, answer, clue = '')
  {
    this.x = x; //x coordinate of the first letter of the word
    this.y = y; //y coordinate of the first letter of the word
    this.number = number; //The number assigned to this word in the clue list.
    this.direction = direction; //Direction (true: Across; false: Down)
    this.answer = answer; //The actual word
    this.clue = clue; //The clue for this word
  }
}
