import image from "../assets/8767132.jpg";
import heroImg from "../assets/sadhanapada.jpg";

const Hero = () => {
  return (
    <div className='prose prose-stone mx-5 my-12 flex max-w-7xl flex-col items-center md:flex-row lg:mx-auto'>
      <div className='mx-auto w-full max-w-[90%] md:mr-3 md:max-w-[46%]'>
        <h1 className=' bg-gradient-to-r from-fuchsia-500 to-cyan-500 bg-clip-text py-3 text-3xl font-extrabold text-transparent lg:text-5xl'>
          Inspire and Be Inspired: Share Your Sadhanapada Stories
        </h1>
        <p className='text-gray-400 md:pt-4 lg:text-lg'>
          Discover the transformative power of Sadhanapada. Join us on a journey
          of self-exploration and spiritual growth, where you can share your
          experiences, learn from others, and deepen your understanding of
          life's purpose. Embrace the path of mindfulness and connection as we
          explore the essence of Sadhanapada together.
        </p>
      </div>
      <div className='mx-auto max-w-[70%] bg-transparent md:max-w-[50%]'>
        <img
          loading='lazy'
          className='w-full transform rounded-lg bg-black transition-transform duration-500 hover:scale-110 '
          src={heroImg}
          alt=''
        />
      </div>
    </div>
  );
};

export default Hero;
