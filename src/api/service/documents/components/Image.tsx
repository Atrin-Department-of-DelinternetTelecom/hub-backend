import { h } from 'nano-jsx';

export default ({
  file,
  extension = 'png',
}: {
  file: Buffer;
  extension?: string;
}) => {
  return (
    <img
      style={{
        // width: 400,
        // height: 400,
        padding: 10,
        margin: 'auto',
      }}
      src={`data:image/${extension};base64,${file.toString('base64')}`}
    />
  );
};
