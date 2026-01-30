var audioContext = null;
var unlocked = false;
var isPlaying = false;      // Are we currently playing?
var startTime;              // The start time of the entire sequence.
var current16thNote;        // What note is currently last scheduled?
var tempo = 120.0;          // tempo (in beats per minute)
var lookahead = 25.0;       // How frequently to call scheduling function 
                            //(in milliseconds)
var scheduleAheadTime = 0.1;    // How far ahead to schedule audio (sec)
                            // This is calculated from lookahead, and overlaps 
                            // with next interval (in case the timer is late)
var nextNoteTime = 0.0;     // when the next note is due.
var noteResolution = 2;     // 0 == 16th, 1 == 8th, 2 == quarter note
var noteLength = 0.05;      // length of "beep" (in seconds)
var canvas,                 // the canvas element
    canvasContext;          // canvasContext is the canvas' context 2D
var last16thNoteDrawn = -1; // the last "box" we drew on the screen
var notesInQueue = [];      // the notes that have been put into the web audio,
                            // and may or may not have played yet. {note, time}
var timerWorker = null;     // The Web Worker used to fire timer messages


var mute = false;


// First, let's shim the requestAnimationFrame API, with a setTimeout fallback
window.requestAnimFrame = window.requestAnimationFrame;

function nextNote() {
    // Advance current note and time by a 16th note...
    var secondsPerBeat = 60.0 / tempo;    // Notice this picks up the CURRENT 
                                          // tempo value to calculate beat length.
    nextNoteTime += 0.25 * secondsPerBeat;    // Add beat length to last beat time

    current16thNote++;    // Advance the beat number, wrap to zero
    if (current16thNote == 16) {
        current16thNote = 0;
    }
}

function scheduleNote( beatNumber, time ) {
    // push the note on the queue, even if we're not playing.
    notesInQueue.push( { note: beatNumber, time: time } );

    if(mute)
      return;

    if ( (noteResolution==1) && (beatNumber%2))
        return; // we're not playing non-8th 16th notes
    if ( (noteResolution==2) && (beatNumber%4))
        return; // we're not playing non-quarter 8th notes

    // create an oscillator
    var osc = audioContext.createOscillator();
    osc.connect( audioContext.destination );
    if (beatNumber % 16 === 0)    // beat 0 == high pitch
        osc.frequency.value = 660.0;
    else if (beatNumber % 4 === 0 )    // quarter notes = medium pitch
        osc.frequency.value = 490.0;
    else                        // other 16th notes = low pitch
        osc.frequency.value = 220.0;

    osc.start( time );
    osc.stop( time + noteLength );
}

function scheduler() {
    // while there are notes that will need to play before the next interval, 
    // schedule them and advance the pointer.
    while (nextNoteTime < audioContext.currentTime + scheduleAheadTime ) {
        scheduleNote( current16thNote, nextNoteTime );
        nextNote();
    }
}

function play() {
    if (!audioContext)
        audioContext = new AudioContext();

    if (!unlocked) {
      // play silent buffer to unlock the audio
      var buffer = audioContext.createBuffer(1, 1, 22050);
      var node = audioContext.createBufferSource();
      node.buffer = buffer;
      node.start(0);
      unlocked = true;
    }

    isPlaying = !isPlaying;

    if (isPlaying) { // start playing
        current16thNote = 0;
        nextNoteTime = audioContext.currentTime;
        timerWorker.postMessage("start");
        return "stop";
    } else {
        reset();
        timerWorker.postMessage("stop");
        return "play";
    }
}

function resetCanvas (e) {
    // resize the canvas - but remember - this clears the canvas too.
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    //make sure we scroll to the top left.
    window.scrollTo(0,0); 
}

let ctl_measure_count = null;
function draw() {
    var currentNote = last16thNoteDrawn;
    if(ctl_measure_count == null)
        ctl_measure_count = document.getElementById('measure_count');

    if (audioContext) {
        var currentTime = audioContext.currentTime;

        while (notesInQueue.length && notesInQueue[0].time < currentTime) {
            currentNote = notesInQueue[0].note;
            notesInQueue.splice(0,1);   // remove note from queue
        }

        let colors = [ 
          '#FFA500', '#ddd', '#ddd', '#ddd',
          '#FFA500','#708090','#708090','#708090',
          '#FFA500', 'grey', 'grey', 'grey',
          '#FFA500', '#444', '#444', '#444',
        ];
        // We only need to draw if the note has moved.
        if (last16thNoteDrawn != currentNote) {
            var x = Math.floor( canvas.width / 18 );
            canvasContext.clearRect(0,0,canvas.width, canvas.height); 
            for (var i=0; i<16; i++) {
                canvasContext.fillStyle = ( currentNote == i ) ? 
                    ((currentNote%4 === 0)?"red":"blue") : colors[i];
                canvasContext.fillRect( x * (i+1), x, x/2, x/2 );
            }

            if(currentNote == 4) {
              ++submeasure_count;
              updateCurrentMeasure(submeasure_count);
            }
            else if(currentNote == 8) {
              ++submeasure_count;
              updateCurrentMeasure(submeasure_count);
            }
            else if(currentNote == 12) {
              ++submeasure_count;
              updateCurrentMeasure(submeasure_count);
            }
            else if(currentNote == 0) {
              submeasure_count = 0;

              ++measure_count;
                if (getMeasureCount() < measure_count) {
                measure_count = 1;
              }

              // ctl_measure_count.innerHTML = measure_count;
              updateMeasures(measure_count, submeasure_count);
            }

            // console.log(currentNote);
            last16thNoteDrawn = currentNote;
        }
    }
    // set up to draw again
    requestAnimFrame(draw);
}

var measureTotal = -1;
function getMeasureCount() {
    if (measureTotal <= 0) {
        measureTotal = document.querySelectorAll('.measure').length;
    }
    return measureTotal;
}

function updateCurrentMeasure(beat) {
  // console.log(`beat: ${beat}`);
  let current = document.querySelector('.current');
  if(current)
    current.classList.add(`part-${beat}`);
}

function updateMeasures(measure) {
  if(measure == 1) {
    clearMeasures();
  }

  // console.log(`updateMeasures: ${measure}`);

  let current = document.querySelector('.current');
  if(current)
    current.className = 'measure past';

  document.getElementById(`measure-${measure}`).classList.add('current');
}

function clearMeasures() {
  document.querySelectorAll('.past').forEach(element => {
    element.classList.remove('past');
  });


    document.querySelectorAll('.current').forEach(element => {
        element.className = 'measure';
    });

  //document.getElementById(`measure-12`).className = 'measure';
}

let measure_count = 0;
let submeasure_count = 0;
function init(){
    var container = document.createElement( 'div' );

    container.className = "container";
    canvas = document.createElement( 'canvas' );
    canvasContext = canvas.getContext( '2d' );
    canvas.width = window.innerWidth; 
    canvas.height = window.innerHeight; 
    document.body.appendChild( container );
    container.appendChild(canvas);    
    canvasContext.strokeStyle = "#ffffff";
    canvasContext.lineWidth = 2;

    measure_count = 0;

    window.onorientationchange = resetCanvas;
    window.onresize = resetCanvas;

    requestAnimFrame(draw);    // start the drawing loop.

    timerWorker = new Worker("js/metronomeworker.js");

    timerWorker.onmessage = function(e) {
        if (e.data == "tick") {
            // console.log("tick!");
            scheduler();
        }
        else
            console.log("message: " + e.data);
    };
    timerWorker.postMessage({"interval":lookahead});
}

function reset() {
    console.log('reset');
    last16thNoteDrawn = -1;
    notesInQueue = [];
    clearMeasures();

    measure_count = 0;
    submeasure_count = 0;
}

window.addEventListener("load", init );

