class VirtualKeyboard
{
  constructor(container)
  {
    this.container = container; //DOM element where the keyboard will create its children (...`PROCREATE`)

    //Define the keyboard layout.
    //Uppercase letters are, well, letters.
    //Lowercase letters describe special keys, listed below.
    //\n separates rows.
    this.layout = "QWERTYUIOP\nASDFGHJKL\nrZXCVBNMb";
    //this.layout = "AZERTYUIOP\nQSDFGHJKLM\nrWXCVBNb"; //TODO: handle alternative layouts like this one!

    //Special keys definitions
    this.specials = {
      'b':{
        content: '<i class="material-icons md-36">backspace</i>',
        action: this.backspace
      },
      'r':{
        content: '<i class="material-icons md-36">undo</i>',
        action: this.rewind
      }
    }

    //Build the keys and bind some events
    this.buildElements();
  }

  //Shorthand for event bindings.
  //VirtualKeyboard will always dispatch custom events from its container,
  // but this method abstracts that entirely.
  // Simply register with `myKeyboard.on('input', someFunction());`
  on(eventType, callback)
  {
    //Under the hood, we're really calling addEventListener
    // and calling the given callback with the event's detail as a parameter
    this.container.addEventListener(eventType, e => callback(e.detail));
  }

  //Action of the 'b' (backspace) special key
  backspace()
  {
    //Create a new Custom Event
    const event = new CustomEvent('backspace', {
      bubbles: true,
      detail: {}
    });
    //And dispatch it
    this.container.dispatchEvent(event);
  }

  //Action of the 'r' (rewind) special key
  rewind()
  {
    const event = new CustomEvent('rewind', {
      bubbles: true,
      detail: {}
    });
    this.container.dispatchEvent(event);
  }

  //Action of any regular key
  input(letter)
  {
    //Create a new Custom Event with the given letter as an additional param
    const event = new CustomEvent('input', {
      bubbles: true,
      detail: letter
    });
    //And dispatch it
    this.container.dispatchEvent(event);
  }

  buildElements()
  {
    //Split the layout string into separate chars
    let keys = this.layout.split("");
    //Will hold the current .key-row element to append to
    let currentRow = null;

    //We'll figure out how many keys are on the row with the biggest amount of keys, and style them accordingly.
    let maxKeysCount = 0;
    let currentKeysCount = 0;
    //Iterate over the keys
    for(let k in keys)
    {
      //New row
      if(keys[k] == '\n')
      {
        //Reset currentRow
        currentRow = null;
        currentKeysCount = 0;
        //And move to the next char
        continue;
      }

      //currentRow is not set
      if(currentRow == null)
      {
        //Create a new one!
        currentRow = document.createElement("div");
        currentRow.classList.add("key-row");
        //Append it to the container
        this.container.append(currentRow);
      }

      //Create a .key element for this key
      let element = document.createElement("div");
      element.classList.add("key");
      //Create a .tooltip element for this key (displayed when the key is pressed)
      let keyTooltip = document.createElement("div");
      keyTooltip.classList.add("tooltip");
      //Does a special key exist for this character?
      if(this.specials.hasOwnProperty(keys[k]))
      {
        //Special keys are larger than regular keys (by an arbitrary 1.5 factor)
        currentKeysCount += 1.5;
        //Add the proper class
        element.classList.add("special");
        //Add the custom content for this key (probably an icon)
        element.innerHTML = this.specials[keys[k]].content;
        keyTooltip.innerHTML = this.specials[keys[k]].content;
        //On click, call this key's action
        element.addEventListener("click", (this.specials[keys[k]].action).bind(this));
      } else
      {
        //No special key exists for this character: this is a regular key
        currentKeysCount += 1;
        //Set a label
        element.innerHTML = keys[k];
        keyTooltip.innerHTML = keys[k];
        //On click, call input with this key's letter
        element.addEventListener("click", () => this.input(keys[k]));
      }

      //Add handlers for the .tooltip to show and hide
      element.addEventListener("touchstart", function(e){
        e.currentTarget.classList.add('pressed')
      }, {passive: true});
      element.addEventListener("touchend", function(e){
        e.currentTarget.classList.remove('pressed')
      });
      //Append the .tooltip to the .key
      element.append(keyTooltip);
      //Append the .key to the current .key-row
      currentRow.append(element);
      
      //Update the count of "maximum keys in a single row"
      maxKeysCount = Math.max(maxKeysCount, currentKeysCount);
    }
    
    //Provide the max amount of keys in a single row as a CSS variable,
    // ensuring we can always style them to fit in the viewport width
    this.container.style.setProperty('--max-keys-count', maxKeysCount);
  }
}
