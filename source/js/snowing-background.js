/*
 * @Description: 
 * @Version: 
 * @Autor: dreamy-xay
 * @Date: 2025-06-22 20:12:39
 * @LastEditors: dreamy-xay
 * @LastEditTime: 2025-06-22 20:44:16
 */
/**
 * 下雪·背景·特效
 */
const snowBackground = () => {
  var canvas = document.getElementById("snow-canvas");
  var ctx = canvas.getContext("2d");
  canvas.style.cssText = `
    position: fixed;
    z-index: 1000;
    pointer-events: none;
    top: 0;
    left: 0;
  `;

  /* 定义x为窗口宽度，y为窗口高度 */
  var x = 0,
    y = 0;
  /* 定义数组，是为了存储每一片雪与雪花的信息 */
  var arr = [];
  /* 假设有300片雪 */
  var num = 300;

  /* 绑定窗口大小发生改变事件，让 canvas 随时铺满浏览器可视区 */
  window.onresize = resizeCanvas;
  function resizeCanvas() {
    x = canvas.width = window.innerWidth;
    y = canvas.height = window.innerHeight;
  }
  resizeCanvas();

  for (let i = 0; i < num; i++) {
    arr.push({
      x: x * Math.random(),
      y: y * Math.random(),
      r: Math.random() * 5,
      color: `rgba(${Math.floor(Math.random() * 255)},${Math.floor(
        Math.random() * 255
      )},${Math.floor(Math.random() * 255)}, ${Math.random()})`,
    });
  }
  /* 创建 image 元素 */
  var img = new Image();
  /* 设置雪花的地址，只有雪花是用图片表示 */
  img.src = "/blog/img/snow.webp";

  function draw() {
    /* 遍历数组 */
    for (let i = 0; i < num; i++) {
      var yuan = arr[i];
      /* 创建路径 */
      ctx.beginPath();
      /* 给雪设置颜色 */
      ctx.fillStyle = yuan.color;
      /* 绘制雪 */
      ctx.arc(yuan.x, yuan.y, yuan.r, 0, 2 * 3.14, false);
      /* 如果i % 30 == 0才绘制雪花，雪花不用太多 */
      if (i % 30 == 0) {
        /* 绘制雪花图片 */
        ctx.drawImage(img, yuan.x, yuan.y, yuan.r * 10, yuan.r * 10);
      }
      /* 填充路径 */
      ctx.fill();
    }
  }

  function updated() {
    for (let i = 0; i < num; i++) {
      var yuan = arr[i];
      /* x轴位置+0.1，变化小点 */
      yuan.x = yuan.x + 0.1;
      /* y轴位置+自身半径一半，这样越大的学走越快 */
      yuan.y = yuan.y + yuan.r / 2;
      /* 如果学已经走出窗口 */
      if (yuan.y > y) {
        /* 重新给雪数组赋值 */
        arr[i] = {
          x: x * Math.random(),
          y: -10,
          r: Math.random() * 5,
          color: `rgba(${Math.floor(Math.random() * 255)},${Math.floor(
            Math.random() * 255
          )},${Math.floor(Math.random() * 255)}, ${Math.random()})`,
        };
      }
    }
  }
  setInterval(function () {
    /* 清屏 */
    ctx.clearRect(0, 0, x, y);
    /* 绘制 */
    draw();
    /* 更新 */
    updated();
  }, 10);
};

snowBackground();
