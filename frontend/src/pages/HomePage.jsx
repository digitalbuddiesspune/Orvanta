import Categories from '../components/Categories'
import Home from '../components/Home'
import FeaturedProducts from '../components/FeaturedProducts'

const HomePage = () => {
  return (
    <div className="w-full">
        <Home/>
        <Categories/>
        <FeaturedProducts/>
    </div>
  )
}

export default HomePage