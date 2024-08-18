export function generateRandomString(stringLength:number,alphaOnly:boolean=false):string {
  const randomChars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const randomAlphas = 'abcdefghijklmnopqrstuvwxyz'
  let result = ''
  for(let i = 0 ; i < stringLength ; i++) {
    if(alphaOnly) {
      result += randomAlphas.charAt(Math.floor((Math.random() * randomAlphas.length)))
    }
    else {
      result += randomChars.charAt(Math.floor((Math.random() * randomChars.length)))
    }
  }

  return result
}

export function generateSlugString(inputString:string):string {
  return String(inputString)
    .normalize('NFKD') // split accented characters into their base characters and diacritical marks
    .replace(/[\u0300-\u036f]/g, '') // remove all the accents, which happen to be all in the \u03xx UNICODE block.
    .trim() // trim leading or trailing whitespace
    .toLowerCase() // convert to lowercase
    .replace(/[^a-z0-9 -]/g, '') // remove non-alphanumeric characters
    .replace(/\s+/g, '-') // replace spaces with hyphens
    .replace(/-+/g, '-'); // remove consecutive hyphens
}
