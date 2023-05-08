import { encode, decode } from "@msgpack/msgpack";


export { msgpack_encode , msgpack_decode };

function msgpack_encode(object) {
    try {
      return encode(object);
    } catch (error) {
      console.error(error, object);
    }
    return null;
}


function msgpack_decode(buffer) {
    try {
      return decode(buffer);
    } catch (error) {
      console.error(error, buffer);
    }
    return null;
}
