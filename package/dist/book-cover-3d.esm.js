import React, { useMemo } from 'react';

/**
 * `BookCover` is the component you can use to display an animated 3D version of your book cover.
 */

var BookCover = function BookCover(_ref) {
  var children = _ref.children,
      _ref$rotate = _ref.rotate,
      rotate = _ref$rotate === void 0 ? 30 : _ref$rotate,
      _ref$rotateHover = _ref.rotateHover,
      rotateHover = _ref$rotateHover === void 0 ? 5 : _ref$rotateHover,
      _ref$perspective = _ref.perspective,
      perspective = _ref$perspective === void 0 ? 600 : _ref$perspective,
      _ref$transitionDurati = _ref.transitionDuration,
      transitionDuration = _ref$transitionDurati === void 0 ? 1 : _ref$transitionDurati,
      _ref$radius = _ref.radius,
      radius = _ref$radius === void 0 ? 2 : _ref$radius,
      _ref$thickness = _ref.thickness,
      thickness = _ref$thickness === void 0 ? 50 : _ref$thickness,
      _ref$bgColor = _ref.bgColor,
      bgColor = _ref$bgColor === void 0 ? '#01060f' : _ref$bgColor,
      _ref$shadowColor = _ref.shadowColor,
      shadowColor = _ref$shadowColor === void 0 ? '#aaaaaa' : _ref$shadowColor,
      _ref$width = _ref.width,
      width = _ref$width === void 0 ? 200 : _ref$width,
      _ref$height = _ref.height,
      height = _ref$height === void 0 ? 300 : _ref$height,
      _ref$pagesOffset = _ref.pagesOffset,
      pagesOffset = _ref$pagesOffset === void 0 ? 3 : _ref$pagesOffset;
  var uniqueId = useMemo(function () {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  }, []);
  var css = getCssForSettings(uniqueId, {
    rotate: rotate,
    rotateHover: rotateHover,
    perspective: perspective,
    transitionDuration: transitionDuration,
    radius: radius,
    thickness: thickness,
    bgColor: bgColor,
    shadowColor: shadowColor,
    width: width,
    height: height,
    pagesOffset: pagesOffset
  });
  return React.createElement(React.Fragment, null, React.createElement("style", null, css), React.createElement("div", {
    className: "book-container-" + uniqueId
  }, React.createElement("div", {
    className: "book"
  }, children)));
};
var getCssForSettings = function getCssForSettings(uniqueId, settings) {
  return "\n    .book-container-" + uniqueId + " {\n      display: flex;\n      align-items: center;\n      justify-content: center;\n      perspective: " + settings.perspective + "px;\n    }\n    \n    @keyframes initAnimation-" + uniqueId + " {\n      0% {\n        transform: rotateY(" + -settings.rotateHover + "deg);\n      }\n      100% {\n        transform: rotateY(" + -settings.rotate + "deg);\n      }\n    }\n    \n    .book-container-" + uniqueId + " .book {\n      width: " + settings.width + "px;\n      height: " + settings.height + "px;\n      position: relative;\n      transform-style: preserve-3d;\n      transform: rotateY(" + -settings.rotate + "deg);\n      transition: transform " + settings.transitionDuration + "s ease;\n      animation: 1s ease 0s 1 initAnimation-" + uniqueId + ";\n    }\n    \n    .book-container-" + uniqueId + " .book:hover {\n      transform: rotateY(" + -settings.rotateHover + "deg);\n    }\n    \n    .book-container-" + uniqueId + " .book > :first-child {\n      position: absolute;\n      top: 0;\n      left: 0;\n      width: " + settings.width + "px;\n      height: " + settings.height + "px;\n      transform: translateZ(" + settings.thickness / 2 + "px);\n      background-color: " + settings.bgColor + ";\n      border-radius: 0 " + settings.radius + "px " + settings.radius + "px 0;\n      box-shadow: 5px 5px 20px " + settings.shadowColor + ";\n      background-color: " + settings.bgColor + ";\n    }\n    \n    .book-container-" + uniqueId + " .book::before {\n      position: absolute;\n      content: ' ';\n      left: 0;\n      top: " + settings.pagesOffset + "px;\n      width: " + (settings.thickness - 2) + "px;\n      height: " + (settings.height - 2 * settings.pagesOffset) + "px;\n      transform: translateX(" + (settings.width - settings.thickness / 2 - settings.pagesOffset) + "px) rotateY(90deg);\n      background: linear-gradient(90deg, \n        #fff 0%,\n        #f9f9f9 5%,\n        #fff 10%,\n        #f9f9f9 15%,\n        #fff 20%,\n        #f9f9f9 25%,\n        #fff 30%,\n        #f9f9f9 35%,\n        #fff 40%,\n        #f9f9f9 45%,\n        #fff 50%,\n        #f9f9f9 55%,\n        #fff 60%,\n        #f9f9f9 65%,\n        #fff 70%,\n        #f9f9f9 75%,\n        #fff 80%,\n        #f9f9f9 85%,\n        #fff 90%,\n        #f9f9f9 95%,\n        #fff 100%\n        );\n    }\n    \n    .book-container-" + uniqueId + " .book::after {\n      position: absolute;\n      top: 0;\n      left: 0;\n      content: ' ';\n      width: " + settings.width + "px;\n      height: " + settings.height + "px;\n      transform: translateZ(" + -settings.thickness / 2 + "px);\n      background-color: " + settings.bgColor + ";\n      border-radius: 0 " + settings.radius + "px " + settings.radius + "px 0;\n      box-shadow: -10px 0 50px 10px " + settings.shadowColor + ";\n    }\n  ";
};

export { BookCover, getCssForSettings };
//# sourceMappingURL=book-cover-3d.esm.js.map
