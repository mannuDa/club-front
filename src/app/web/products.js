import React from "react";

const productData = [
  {
    id: 1,
    title: "Minimalist Summer Tee",
    price: 18.25,
    image: "assets/images/product_01.jpg",
    category: "des", // featured
    reviews: 12,
  },
  {
    id: 2,
    title: "Urban Flash Jacket",
    price: 16.75,
    image: "assets/images/product_02.jpg",
    category: "dev", // flash deals
    reviews: 24,
  },
  {
    id: 3,
    title: "Weekend Explorer Pants",
    price: 32.5,
    image: "assets/images/product_03.jpg",
    category: "gra", // last minute
    reviews: 36,
  },
  {
    id: 4,
    title: "Retro Denim Shirt",
    price: 24.6,
    image: "assets/images/product_04.jpg",
    category: "gra",
    reviews: 48,
  },
  {
    id: 5,
    title: "Flash Deal: Club Avis Cap",
    price: 18.75,
    image: "assets/images/product_05.jpg",
    category: "dev",
    reviews: 60,
  },
  {
    id: 6,
    title: "Classic White Shirt",
    price: 12.5,
    image: "assets/images/product_06.jpg",
    category: "des",
    reviews: 72,
  },
];

const Product = () => {
  return (
    <>
      <div className="page-heading products-heading header-text">
        <div className="container">
          <div className="row">
            <div className="col-md-12">
              <div className="text-content">
                <h4>new arrivals</h4>
                <h2>Club Avis Products</h2>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="products">
        <div className="container">
          <div className="row">
            {/* Filters */}
            <div className="col-md-12">
              <div className="filters">
                <ul>
                  <li className="active" data-filter="*">All Products</li>
                  <li data-filter=".des">Featured</li>
                  <li data-filter=".dev">Flash Deals</li>
                  <li data-filter=".gra">Last Minute</li>
                </ul>
              </div>
            </div>

            {/* Products Grid */}
            <div className="col-md-12">
              <div className="filters-content">
                <div className="row grid">
                  {productData.map((product) => (
                      <div className={`col-lg-4 col-md-4 all ${product.category}`} key={product.id}>
                      <div className="product-item">
                        {/* <a href="#"> <img src={product.image} alt={product.title} /> </a> */}
                        <div className="down-content">
                        <p>Coming Soon....</p> 
                          {/* <a href="#">
                            <h4>{product.title}</h4>
                          </a>
                          <h6>₹{product.price.toFixed(2)}</h6>
                          <p>
                            Lorem ipsum dolor sit amet, adipisicing elit. Itaque, corporis nulla aspernatur.
                          </p>
                          <ul className="stars">
                            {[...Array(5)].map((_, i) => (
                              <li key={i}>
                                <i className="fa fa-star"></i>
                              </li>
                            ))}
                          </ul>
                          <span>Reviews ({product.reviews})</span> */}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Pagination */}
            <div className="col-md-12">
              <ul className="pages">
                <li><a href="#">1</a></li>
                <li className="active"><a href="#">2</a></li>
                <li><a href="#">3</a></li>
                <li><a href="#">4</a></li>
                <li><a href="#"><i className="fa fa-angle-double-right"></i></a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Product;
