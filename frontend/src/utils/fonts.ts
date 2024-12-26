// 定义字体加载函数
export const loadWebFont = (fontFamily: string, fontUrl: string) => {
  const fontFace = new FontFace(fontFamily, `url(${fontUrl})`);
  return fontFace.load().then((font) => {
    document.fonts.add(font);
    return fontFamily;
  });
};

// 预加载常用字体
export const preloadFonts = async () => {
  const fonts = [
    {
      family: 'Cascadia Code',
      url: '/fonts/CascadiaCode.woff2',
    },
  ];

  return Promise.all(fonts.map((font) => loadWebFont(font.family, font.url)));
};
