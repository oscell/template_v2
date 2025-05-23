import { useParams } from 'react-router-dom';
import { useInstantSearch } from 'react-instantsearch';
import { GetTheLook } from './carousel';

export function ProductDetail() {
  const { productId } = useParams();
  const { results } = useInstantSearch();

  // Find the product in the current results
  const product = results?.hits.find(hit => hit.objectID === productId);

  if (!product) {
    return <div className="p-4">Product not found</div>;
  }

  return (
    <div className="p-4">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Product Image */}
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
            {product.image && (
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-4">
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <p className="text-2xl font-semibold">${product.price}</p>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Description</h2>
              <p className="text-gray-600">{product.description}</p>
            </div>
            {product.color && (
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Color</h2>
                <p className="text-gray-600">{product.color}</p>
              </div>
            )}
            {product.subcategories && (
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Categories</h2>
                <p className="text-gray-600">{product.subcategories.join(', ')}</p>
              </div>
            )}
          </div>
        </div>
        <GetTheLook productId={productId!} />
      </div>
    </div>
  );
} 