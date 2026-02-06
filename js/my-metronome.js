
    function onTempoInput(event) {
        // tempo = event.target.value;
        tempoChange(event.target.value);
    }

    function tempoChange(_tempo) {
        console.log('tempoChange');
        tempo = _tempo;
        document.getElementById('showTempo').innerText=tempo;

        setCookie('tempo', _tempo);
    }

    const bpmTempo = document.getElementById('tempo');
    const bpmShowTempo = document.getElementById('showTempo');
    function onBpmSet(bpm) {
        bpmTempo.value = bpm;
        tempoChange(bpm);
    }

    function muteChanged(sender) {
        mute = sender.checked;
        setCookie('mute', mute);
    }

    function noteResolutionChanged(sender) {
        noteResolution = sender.selectedIndex;
        setCookie('note-resolution', noteResolution);
    }

    function measureClicked(sender) {
        let text = sender.innerHTML.replace('&nbsp;', '').trim();
        console.log('measure clicked', sender, text);

        // let list = "I,II,III,IV,V,VI,VII,i,ii,iii,iv,v,vi,vii,&nbsp;".split(',');
        let list = "I,ii,iii,IV,V,vi,&nbsp;".split(',');


        let idx = list.indexOf(text) + 1;
        if (idx >= list.length) {
            idx = 0;
        }

        sender.innerHTML = list[idx];
    }

    function measureCountChanged(sender) {
        console.log('measureCountChanged', sender, sender.value);

        switch (sender.value) {
            case 16:
                break;

            case 32:
                break;
        }
    }

    function initializeParentKeySelection() {
        let selection = document.createElement('select');
        selection.id = 'scale-select';
        selection.name = 'Parent Key';
        let scales = [ {
            scale: 'C',
            display: 'C-Major'
        }, 
        {
            scale: 'G',
            display: 'G-Major'
        }, 
        {
            scale: 'D',
            display: 'D-Major'
        }, 
        {
            scale: 'A',
            display: 'A-Major'
        }, 
        {
            scale: 'E',
            display: 'E-Major'
        }, 
        {
            scale: 'F',
            display: 'F-Major'
        }, 
        ];

        for(let i = 0; i < scales.length; ++i) {
            let s = scales[i];
            let option = new Option(s.display, s.scale);

            selection.add(option);
        }

        selection.addEventListener("change", (event) => {
            console.log(`Selected value: ${event.target.value}`);
            loadFretboard_loadScaleDegree(event.target.value, 1);
        });

        let container = document.getElementById('fretboard-title');
        container.classList.add('fretboard-controls');
        container.appendChild(selection);

        let select_type = document.createElement('select');
        select_type.id = 'scale-type-select';
        select_type.name = 'Scale Type';
        select_type.add(new Option('Scale', 'scale'));
        select_type.add(new Option('Pentatonic', 'pentatonic'));
        select_type.add(new Option('Triads', 'triads'));
        container.appendChild(select_type);
        
    }

    let fretboardInit = false;
    function loadFretboard( options) {
            
        if(!fretboardInit) {

            fretboard_img_url_root = `/music-tools/`;
            fretboard_enable_tone = false;
            
            init();
                
            initializeParentKeySelection();

            on_new_measure_callback = load_next_pattern;

            fretboardInit = true;
        }
            
        let args = options;
        if(args == null) {
            args = {
                minor: false,
                "pattern": true,
                "key": "C"
            }
        }

        if (args.pattern) {
            clear('fretboard-header');
            clear('fretboard');
            loadPatterns(args);
        }


        // let noteData = getNoteData();
        // let scales = noteData.scale;
        // console.log(loadFretboard_getScaleDegree(scales.C, 1));
    }

    function loadFretboard_getScaleDegree(scale, degree) {
            
        if(scale.length > 0 && scale.length > 6 && degree >= 1 && degree <= 7 ) {
            return scale[degree - 1];
        }

        return null;
    }

    function loadFretboard_loadScaleDegree(parentScale, degree) {
        let major = " C G D A E B F Bf Ef Af Df Gf ";
        let minor = " a e b es cs gs d g c f bb ef "

        if(major.indexOf(` ${parentScale} `) > -1 ) {
                
            let noteData = getNoteData();
            let scales = noteData.scale;
            let args = {pattern: true};
            let scale_type = document.getElementById('scale-type-select');
            if(scale_type.value === 'pentatonic') {
                args.chord = true;
                args.pentatonic = true;
            } else if(scale_type.value === 'triads') {
                args.chord = true;
                args.triads = true;
            }
            if(degree == 2 || degree == 3 || degree == 6) {
                args.minor = true;
                args.key = getKeyRelative(loadFretboard_getScaleDegree(scales[parentScale], degree));
                // let args = {
                //         minor: true,
                //         pattern: true,
                //         triads: true,
                //         chord: true,
                //         key: getKeyRelative(loadFretboard_getScaleDegree(scales[parentScale], degree))
                //     }
                console.log('degree 2 3 or 6', args);
                loadFretboard(args);
            } else if(degree == 1 || degree == 4 || degree == 5) {
                args.major = true;
                args.key = loadFretboard_getScaleDegree(scales[parentScale], degree).toUpperCase();
                    //let args = {
                    //    major: true,
                    //    pattern: true,
                    //    triads: true,
                    //    chord: true,
                    //    key: loadFretboard_getScaleDegree(scales[parentScale], degree).toUpperCase()
                    //}
                console.log('degree 1 4 or 5', args);
                loadFretboard(args);
            } else {
                console.log('loadFretboard_loadScaleDegree - unhanded degree');
            }
        }
    }

    function load_next_pattern() {
        console.log('call back');
        
        let current = document.querySelector('.current');
        if(current) {
            console.log(current.innerHTML);
        
            let numerals = {
               'I': 1,
               'II': 2,
               'III': 3,
               'IV': 4,
               'V': 5,
               'VI': 6
            };

            let degree = numerals[current.innerHTML.toUpperCase()];
            if(degree) {
                loadFretboard_loadScaleDegree(document.getElementById('scale-select').value, degree);
            }
        }
    }

    function showFretboardChanged(sender) {
        console.log(sender);
        let container = document.getElementById('fretboard-container-1');
        if(sender.checked) {
            if(container == null) {
                loadFretboard();
            } else {
                container.classList.remove('hidden');
            }
        } else {
           if(container) {
               container.classList.add('hidden');
           }
        }
    }

    function onPageLoad(e) {
        console.log('onPageLoad');

        //loadFretboard();

        let tempoValue = getCookie('tempo') || 120;
        let _noteResolution = getCookie('note-resolution') || 2;
        let _mute = getCookie('mute') || false;


        let tempoLabel = document.getElementById('showTempo');
        let tempoCtl = document.getElementById('tempo');
        let noteResolutionCtl = document.getElementById('note-resolution');
        let muteCtl = document.getElementById('mute');


        tempoCtl.value = tempoValue;
        tempo = Number(tempoCtl.value);
        tempoLabel.innerHTML = tempoValue;

        noteResolutionCtl.selectedIndex = _noteResolution;
        noteResolution = _noteResolution;

        muteCtl.checked = _mute === 'true';
        mute = _mute === 'true';
            
    }

    function setCookie(name, value, _days) {
        const expires = new Date();
        let days = _days || 120;

        expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
        const expiresString = `expires=${expires.toUTCString()}`;

        let document = parent.document;
        if (document) {
            document.cookie = `${name}=${value}; ${ expiresString }; path=/`;
        }
    }

    function getCookie(name) {
        const nameEq = name + "=";
        const document = parent.document;

        if (document) {
            const cookies = document.cookie.split(';');

            for (let i = 0; i < cookies.length; ++i) {
                let cookie = cookies[i].trim();
                if (cookie.indexOf(nameEq) == 0) {
                    //return cookie.substr(nameEq.length, cookie.length);
                    return cookie.split('=')[1];
                }
            }
        }

        return '';
    }

    bpm.init('tempoLabel', onBpmSet);