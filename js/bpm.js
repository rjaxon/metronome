
let bpm = {

  tapTimes: null,
  bpmSetEvent: null,

  init: function (tap_id, bpmSetCallback) {
      this.tapTimes = [];

      let element = document.getElementById(tap_id);
      element.addEventListener('click', 
        () => { 
          this.onclick()
        }
      );
    
      if(bpmSetCallback)
        this.bpmSetEvent = bpmSetCallback;
    },

    onclick: function () {
        const now = Date.now();
        let tapTimes = this.tapTimes;
        tapTimes.push(now);
    
        // Keep only the last 10 taps for a more accurate BPM calculation
        if (tapTimes.length > 10) {
            tapTimes.shift();
        }
    
        if (tapTimes.length > 1) {
            const intervals = tapTimes.slice(1).map((time, index) => time - tapTimes[index]);
            const averageInterval = intervals.reduce((a, b) => a + b) / intervals.length;
            const bpm = Math.round(60000 / averageInterval);
    
            if(this.bpmSetEvent)
              this.bpmSetEvent(bpm);
        }
    }


};





