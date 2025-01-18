
let outputSizeValue=3;
// 乱数
function rndInt(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    };

// 一括ダウンロード
function allDownload() {
      // console.log('Current output size:', outputSizeValue); 
      html2canvas(document.querySelector('.output-container'),{
        scale:outputSizeValue
      }).then(canvas => {
          const link = document.createElement('a');
          const now = new Date();
          const filename = `output_image_${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}${now.getMilliseconds().toString().padStart(3, '0')}.png`;
          link.download = filename;
          link.href = canvas.toDataURL('image/png');
          link.click();
      });
    };
// 出力ログをクリア
function clearOutput(){
      const outputContainer = document.querySelector('.output-container');
      outputContainer.innerHTML = ''; // output-container内の要素を全削除
    };


const app = Vue.createApp({

  data() {
    return {
      canvasSize:{
        s480x640:[480,640],
        s512x512:[512,512],
        s640x480:[640,480]
      },
      colorPalettes: {
        Sky: ["#361487","#9a4269","#cc9b8f","#9bd5ff"],
        Forest: ["#273b09","#63521d","#3b713b","#838f4a"],
        Marine: ["#1e5764","#50a4a2","#81f0df","#ffe173"],
        Mono: ['#000000','#404040', '#808080', '#C0C0C0']
      },
      markerShapes: ['○△△', '○△△□□', '○△△♡□□', '○△△♡', '○○○', '○○○○', '○○○○○', '○○○○○○','特盛'],
      markerColors: {
        Vivid: ['#FF5733', '#33FF57', '#3357FF', '#F1C40F'],
        Pale: ['#FADBD8', '#D5DBDB', '#D4E6F1', '#F9E79F'],
        Dark: ['#C0392B', '#27AE60', '#2980B9', '#8E44AD'],
        Mono: ['#000000','#404040', '#808080', '#C0C0C0']
      },


      brushSize: 3,
      brushColor: "#50a4a2",
      currentCanvasSize:"s480x640",
      currentPalette:"Marine",
      currentMarkerColors: "Vivid",
      currentMarkerShapes:"特盛",
      outputSize:5,
      dialogBeforeUnload:true,

      isEraserMode: false,
      isSettingsModalOpen: false,
      canvas: null, 
      pencilBrush: null,
      isDrawing: false, 
      lastPointer: null, 
      group: null, 
      isDarkMode: false
    }
  },
  mounted() {
    // console.log(`コンポーネントがマウントされました。`);
    this.loadSettings(); // ウィンドウが開いたときに設定を読み込む

    this.isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches; // ダークモード設定をisDarkModeに代入

    this.canvas = new fabric.Canvas('canvas', { 
      isDrawingMode: true,
      freeDrawingBrush: new fabric.PencilBrush(), 
      backgroundColor : 'white'
    }); 
    this.pencilBrush = new fabric.PencilBrush(this.canvas);
    this.canvas.freeDrawingBrush = this.pencilBrush; 
    this.updateBrush(); 
    this.updateOutputSize();
    clearOutput();

  // マーカーの追加
    this.addMarker();

    this.updateBrush();

    // 描画開始と終了のイベントを設定
    this.canvas.on('mouse:down', (event) => {
          this.isDrawing = true; // 描画開始
          this.lastPointer = this.canvas.getPointer(event); // 最後のポインタ位置を取得
          this.updateBrush(); // ブラシを更新
        });
    this.canvas.on('mouse:up', () => {
      this.isDrawing = false; // 描画終了
    });
    this.canvas.on('mouse:move', (event) => {
      if (this.isDrawing) {
        const pointer = this.canvas.getPointer(event);
        // 描画中の線を更新
        this.canvas.freeDrawingBrush.onMouseMove(pointer);
        this.lastPointer = pointer; // 最後のポインタ位置を更新
      }
    });

    this.canvas.on('object:added', (event) => {
      if (this.group) {
        this.canvas.bringToFront(this.group); // グループを最前面に移動
      }
    });

    window.addEventListener('beforeunload', () => {
      const outputContainer = document.querySelector('.output-container');
      // console.log(outputContainer.innerHTML)
      // 閉じる時に警告
      if(this.dialogBeforeUnload){
        if (outputContainer.innerHTML != '' || this.canvas.getObjects().length > 1) {
          event.preventDefault();
          event.returnValue = ''; // Chrome ではこの行が必要 
        }
      }
      this.saveSettings(); // ウィンドウを閉じる前に設定を保存
    });
  },
  watch: {
    brushSize() {
      this.updateBrush();
    },
    brushColor() {
      this.updateBrush();
    },
    isDarkMode() {
      // ダークモード切り替え
      if (this.isDarkMode) {
            document.documentElement.classList.add('dark-mode');
            document.documentElement.classList.remove('light-mode');
        } else {
            document.documentElement.classList.add('light-mode');
            document.documentElement.classList.remove('dark-mode');
        }
    }
  },
  
  methods: {
    
    openSettingsModal() {
      this.isSettingsModalOpen = true;
    },
    closeSettingsModal() {
      this.isSettingsModalOpen = false;
    },

    toggleDarkMode(){
     this.isDarkMode = !this.isDarkMode; // isDarkModeの値を反転
     console.log(this.isDarkMode)
//            localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
    },
    // マーカーの追加
    addMarker(){
      // 選択に従ってshapesに文字列を代入
      const shapes = this.currentMarkerShapes === '特盛' 
        ? Array.from({ length: Math.floor(Math.random() * 21) + 10 }, () => {
            const shapeOptions = ['○', '□', '△', '♡'];
            return shapeOptions[Math.floor(Math.random() * shapeOptions.length)];
          }).join('') 
        : this.currentMarkerShapes === '無し' 
          ? '' 
          : this.currentMarkerShapes === 'ぐるぐる' 
            ? '＠' 
            : this.currentMarkerShapes;

      this.group = new fabric.Group([]);
      for (let shape of shapes) {
        let newShape;
        if (shape === '○') {
          newShape = this.drawCircle(); 
        } else if (shape === '□') {
          newShape = this.drawRectangle(); 
        } else if (shape === '△') {
          newShape = this.drawTriangle(); 
        } else if (shape === '♡') {
          newShape = this.drawHeart(); 
        } else if (shape === '＠') {
          newShape = this.drawScribble();
        } else if (shape === '★') {
          newShape = this.drawpolygon();
        } else if (shape === '☆') {
          newShape = this.drawpolygon2();
        }
        if (newShape) {
          this.group.addWithUpdate(newShape); // グループに追加
        }
      }
      this.canvas.add(this.group); // キャンバスにグループを追加
      this.canvas.bringToFront(this.group); // グループを最前面に移動
    },

    clearDraw(){
      this.canvas.getObjects().forEach((obj) => {
        if (obj !== this.group) {
          this.canvas.remove(obj); // groupオブジェクト以外をキャンバスから削除
        }
      });
    },
    clearCanvas() {
      this.canvas.clear(); // キャンバスを全消去
      this.addMarker();
      this.isDrawing = false; // 描画状態をリセット
      this.canvas.backgroundColor="white";
    },

    // マーカー図形の設定
    drawRectangle() {
      const rect = new fabric.Rect({
        selectable: false,
        left: rndInt(0,this.canvasSize[this.currentCanvasSize][0]-50),
        top: rndInt(0,this.canvasSize[this.currentCanvasSize][1]-50), 
        fill: "transparent",
        angle: rndInt(0,180),
        stroke: this.markerColors[this.currentMarkerColors][0]+ '80',
        strokeWidth: 3,
        originX: "center",
        originY: "center",
        width: rndInt(30,150),
        height: rndInt(30,150) 
      });
      return rect; // 四角形を返す
    },
    drawCircle() {
      const circle = new fabric.Circle({
        selectable: false,
        originX: "center",
        originY: "center",
        left: rndInt(0, this.canvasSize[this.currentCanvasSize][0]),
        top: rndInt(0, this.canvasSize[this.currentCanvasSize][1]),
        radius: rndInt(50, 200), // 半径
        fill: "transparent",
        stroke: this.markerColors[this.currentMarkerColors][1] + '80', 
        strokeWidth: 3
      });
      return circle; // 円を返す
    },

    drawTriangle() {
      const triangle = new fabric.Triangle({
        selectable: false,
        originX: "center",
        originY: "center",
        left: rndInt(0, this.canvasSize[this.currentCanvasSize][0]), 
        top: rndInt(0, this.canvasSize[this.currentCanvasSize][1]),         width: rndInt(30, 80), 
        height: rndInt(50, 150),
        angle: rndInt(0,360),
        fill: "transparent",
        stroke: this.markerColors[this.currentMarkerColors][2]+ '80',
        strokeWidth: 3
      });
      return triangle; // 三角形を返す
    },

    drawHeart() {
      const heartPath = 'M 80,30 C 80,10 120,10 120,30 C 120,50 80,70 80,70 C 80,70 40,50 40,30 C 40,10 60,10 80,30 Z'; // ハート型のパス
      const scale =rndInt(10,30);
      const heart = new fabric.Path(heartPath, {
        selectable: false,
        originX: "center",
        originY: "center",
        left: rndInt(0, this.canvasSize[this.currentCanvasSize][0]), 
        top: rndInt(0, this.canvasSize[this.currentCanvasSize][1]), 
        fill: "transparent",
        stroke: this.markerColors[this.currentMarkerColors][3]+ '80',
        strokeWidth: 3/scale*10,
        angle: rndInt(0,360),
        scaleX: scale/10,
        scaleY: scale/10

      });
      return heart; // ハートを返す
    },
    drawpolygon(){
      const times = rndInt(3, 8);
      let pathData = "M"+rndInt(10, this.canvasSize[this.currentCanvasSize][0])+" "+rndInt(10, this.canvasSize[this.currentCanvasSize][1]);

        for (let i = 0; i < times; i++) {
        pathData = pathData + " L"+rndInt(1, this.canvasSize[this.currentCanvasSize][0])+" "+rndInt(1, this.canvasSize[this.currentCanvasSize][1])+" "+rndInt(1, this.canvasSize[this.currentCanvasSize][0])+" "+rndInt(1, this.canvasSize[this.currentCanvasSize][1])+" "
      }
      pathData = pathData+" Z";

      const scale =rndInt(10,20);
      const polygon = new fabric.Path(pathData, {
        selectable: false,
        originX: "center",
        originY: "center",
        left: this.canvasSize[this.currentCanvasSize][0] / 2, 
        top: this.canvasSize[this.currentCanvasSize][1] / 2, 
        fill: "transparent",
        stroke: this.markerColors[this.currentMarkerColors][1]+ '80',
        strokeWidth: 2/scale*10,
        scaleX: scale/10,
        scaleY: scale/10

      });



      return polygon;

    },
    drawpolygon2() {
      const times = rndInt(4, 10);
      const radius = Math.min(this.canvasSize[this.currentCanvasSize][0], this.canvasSize[this.currentCanvasSize][1]) / 3; 
      const centerX = this.canvasSize[this.currentCanvasSize][0] / 2; 
      const centerY = this.canvasSize[this.currentCanvasSize][1] / 2; 
      const points = []; // 座標を格納する配列
      const angles = Array.from({length: times}, () => rndInt(0, 360))
      .sort((a, b) => a - b);

      angles.forEach(angle => {
        const radian = angle * Math.PI / 180;
        const x = centerX + radius * Math.cos(radian);
        const y = centerY + radius * Math.sin(radian);
        points.push(x + " " + y);
      });

      let pathData = "M " + points[0];

        for (let i = 1; i < times-1; i++) {
        pathData = pathData + " L "+points[i+1];
      }
      pathData = pathData+" Z";
      // console.log(pathData)
      const scale =rndInt(10,20);
      const polygon2 = new fabric.Path(pathData, {
        selectable: false,
        originX: "center",
        originY: "center",
        left: this.canvasSize[this.currentCanvasSize][0] / 3, 
        top: this.canvasSize[this.currentCanvasSize][1] / 2, 
        fill: "transparent",
        stroke: this.markerColors[this.currentMarkerColors][1]+ '80',
        strokeWidth: 2/scale*10,
        scaleX: scale/10,
        scaleY: scale/10

      });

      return polygon2;
    },
    drawScribble(){
      const times = rndInt(10, 50);
      let pathData = "M"+rndInt(10, this.canvasSize[this.currentCanvasSize][0])+" "+rndInt(10, this.canvasSize[this.currentCanvasSize][1]);

        for (let i = 0; i < times; i++) {
        pathData = pathData + " C"+rndInt(1, this.canvasSize[this.currentCanvasSize][0])+" "+rndInt(1, this.canvasSize[this.currentCanvasSize][1])+" "+rndInt(1, this.canvasSize[this.currentCanvasSize][0])+" "+rndInt(1, this.canvasSize[this.currentCanvasSize][1])+" "+rndInt(1, this.canvasSize[this.currentCanvasSize][0])+" "+rndInt(1, this.canvasSize[this.currentCanvasSize][1])+" "
      }
      pathData = pathData+" Z";

      const scale =rndInt(10,20);
      const scribble = new fabric.Path(pathData, {
        selectable: false,
        originX: "center",
        originY: "center",
        left: this.canvasSize[this.currentCanvasSize][0] / 2, 
        top: this.canvasSize[this.currentCanvasSize][1] / 2, 
        fill: "transparent",
        stroke: this.markerColors[this.currentMarkerColors][1]+ '80',
        strokeWidth: 2/scale*10,
        scaleX: scale/10,
        scaleY: scale/10

      });
      return scribble;
    },

    // キャンバスサイズ変更
    changeCanvasSize(size) {
      this.canvas.setWidth(this.canvasSize[this.currentCanvasSize][0]);
      this.canvas.setHeight(this.canvasSize[this.currentCanvasSize][1]);
      this.canvas.renderAll(); // キャンバスを再描画
    },

    // ブラシの切り替えとかをなんか
    updateBrush(){
      if (this.isEraserMode) {
        // 消しゴムの設定に切り替え
        this.canvas.freeDrawingBrush.width = 30; 
        this.canvas.freeDrawingBrush.color = 'white';
      } else {
        // 設定をブラシに切り替え
        this.canvas.freeDrawingBrush.width = this.brushSize; 
        this.canvas.freeDrawingBrush.color = this.brushColor; 
      }
      this.canvas.isDrawingMode = true; // 描画モードを再設定
    },
    updateOutputSize(){
      outputSizeValue = this.outputSize;
    },


    // キャンバスを画像として出力
    outputImage() {
      // 要素を取得
      const canvasOutput = document.getElementById('canvas');
      const outputContainer = document.querySelector('.output-container'); 

      // キャンバスを画像に変換
      const image = new Image();
      image.src = canvasOutput.toDataURL('image/png'); 

      // 画像が読み込まれたら出力コンテナに追加
      image.onload = () => {
          const link = document.createElement('a');
          link.href = image.src;
          const now = new Date();
          const filename = `canvas_image_${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}${now.getMilliseconds().toString().padStart(3, '0')}.png`;
          link.download = filename;
          link.innerHTML = '<img src="' + image.src + '" style="width: 100px; margin: 5px;" alt="出力画像">'; 
          outputContainer.appendChild(link); // 出力コンテナにリンクを追加
      };
    },

 // 設定をローカルストレージに保存
    saveSettings() {
      const settings = {
        brushSize: this.brushSize,
        brushColor: this.brushColor,
        currentCanvasSize: this.currentCanvasSize,
        currentPalette: this.currentPalette,
        currentMarkerColors: this.currentMarkerColors,
        currentMarkerShapes: this.currentMarkerShapes,
        dialogBeforeUnload: this.dialogBeforeUnload,
      };
      localStorage.setItem('drawingAppSettings', JSON.stringify(settings));
    },
    // 設定を読み込む
    loadSettings() {
      const savedSettings = localStorage.getItem('drawingAppSettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        this.brushSize = settings.brushSize;
        this.brushColor = settings.brushColor;
        this.currentCanvasSize = settings.currentCanvasSize;
        this.currentPalette = settings.currentPalette;
        this.currentMarkerColors = settings.currentMarkerColors;
        this.currentMarkerShapes = settings.currentMarkerShapes;
        this.dialogBeforeUnload = settings.dialogBeforeUnload;
      }
    },
  }
});

app.mount('#app');
