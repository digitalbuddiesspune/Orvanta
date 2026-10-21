import crypto from "crypto";
import bcrypt from "bcryptjs";
import Order from "../models/Order.js";
import Cart from "../models/cart.js";
import Product from "../models/Product.js";
import User from "../models/user.js";

const isObjectId = (value) => /^[a-fA-F0-9]{24}$/.test(String(value || ""));

const hasCompleteShippingAddress = (shippingAddress) =>
  Boolean(
    shippingAddress?.fullName &&
      shippingAddress?.phone &&
      shippingAddress?.addressLine1 &&
      shippingAddress?.city &&
      shippingAddress?.state &&
      shippingAddress?.pincode
  );

const resolveCustomerUser = async ({ userId, customer }) => {
  if (isObjectId(userId)) {
    const existing = await User.findById(userId);
    if (existing) return existing;
  }

  const email = customer?.email?.trim()?.toLowerCase();
  const phone = customer?.phone?.trim();
  const name = customer?.name?.trim() || "Walk-in Customer";

  if (email) {
    const byEmail = await User.findOne({ email });
    if (byEmail) return byEmail;
  }

  if (phone) {
    const byPhone = await User.findOne({ phone });
    if (byPhone) return byPhone;
  }

  const generatedEmail =
    email ||
    `walkin.${(phone || "guest").replace(/\D/g, "") || "guest"}.${Date.now()}@orvanta.local`;

  const hashedPassword = await bcrypt.hash(crypto.randomBytes(16).toString("hex"), 10);

  return User.create({
    name,
    email: generatedEmail,
    phone: phone || "0000000000",
    password: hashedPassword,
    role: "user",
  });
};

export const placeOrder = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { shippingAddress, paymentMethod = "COD", note } = req.body;

    if (!hasCompleteShippingAddress(shippingAddress)) {
      return res.status(400).json({
        success: false,
        message: "Complete shipping address is required",
      });
    }

    const cart = await Cart.findOne({ user: userId }).populate({
      path: "items.product",
      model: "Product",
    });

    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    let itemsTotal = 0;
    const orderItems = [];

    for (const item of cart.items) {
      if (!item.product) continue;

      const product = item.product;
      let unitPrice = product.price;

      const bulkOffer = product.bulkOffers
        ?.filter((offer) => item.quantity >= offer.minQty)
        .sort((a, b) => b.minQty - a.minQty)[0];

      if (bulkOffer) {
        unitPrice = bulkOffer.pricePerPiece;
      }

      const itemTotal = unitPrice * item.quantity;
      itemsTotal += itemTotal;

      orderItems.push({
        product: product._id,
        name: product.name,
        image: product.images?.[0] || "",
        price: unitPrice,
        quantity: item.quantity,
        itemTotal,
      });
    }

    const shippingCost = 0;
    const totalAmount = itemsTotal + shippingCost;

    const order = await Order.create({
      user: userId,
      items: orderItems,
      shippingAddress,
      paymentMethod,
      itemsTotal,
      shippingCost,
      totalAmount,
      status: "Confirmed",
      note: note || "",
    });

    cart.items = [];
    cart.totalPrice = 0;
    await cart.save();

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: order,
    });
  } catch (error) {
    console.error("Place order error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to place order",
      error: error.message,
    });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const userId = req.user.userId;

    const orders = await Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate({
        path: "items.product",
        model: "Product",
        select: "name slug images price",
      });

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error("Get orders error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { orderId } = req.params;

    const order = await Order.findOne({ _id: orderId, user: userId }).populate({
      path: "items.product",
      model: "Product",
      select: "name slug images price",
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Get order error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order",
      error: error.message,
    });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate("user", "name email phone")
      .populate({
        path: "items.product",
        model: "Product",
        select: "name slug images price",
      });

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error("Get all orders error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { orderId } = req.params;

    const order = await Order.findOne({ _id: orderId, user: userId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const cancellableStatuses = ["Pending", "Confirmed"];
    if (!cancellableStatuses.includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled. Current status: ${order.status}`,
      });
    }

    order.status = "Cancelled";
    await order.save();

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      data: order,
    });
  } catch (error) {
    console.error("Cancel order error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel order",
      error: error.message,
    });
  }
};

export const createAdminOrder = async (req, res) => {
  try {
    const {
      userId,
      customer,
      items,
      shippingAddress,
      paymentMethod = "COD",
      shippingCost = 0,
      gstAmount = 0,
      gstRate = 18,
      note,
      invoiceDate,
    } = req.body;

    if (!hasCompleteShippingAddress(shippingAddress)) {
      return res.status(400).json({
        success: false,
        message: "Complete customer address is required to create the order",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Add at least one product",
      });
    }

    const orderItems = [];
    let itemsTotal = 0;

    for (const item of items) {
      const productId = item.productId || item.product;
      if (!isObjectId(productId)) {
        return res.status(400).json({
          success: false,
          message: `Invalid product on the bill${item.name ? `: ${item.name}` : ""}`,
        });
      }

      const product = await Product.findById(productId);
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product not found${item.name ? `: ${item.name}` : ""}`,
        });
      }

      const quantity = Math.max(1, Number(item.quantity) || 1);
      const price = Math.max(0, Number(item.price) || 0);
      const itemTotal = price * quantity;
      itemsTotal += itemTotal;

      orderItems.push({
        product: product._id,
        name: item.name || product.name,
        image: item.image || product.images?.[0] || "",
        price,
        quantity,
        itemTotal,
      });
    }

    const shipping = Math.max(0, Number(shippingCost) || 0);
    const gst = Math.max(0, Number(gstAmount) || 0);
    const totalAmount = itemsTotal + shipping + gst;
    const allowedPayments = ["COD", "Online", "Manual"];
    const method = allowedPayments.includes(paymentMethod) ? paymentMethod : "COD";

    const user = await resolveCustomerUser({
      userId,
      customer: {
        name: customer?.name || shippingAddress.fullName,
        email: customer?.email,
        phone: customer?.phone || shippingAddress.phone,
      },
    });

    const orderPayload = {
      user: user._id,
      items: orderItems,
      shippingAddress,
      paymentMethod: method,
      itemsTotal,
      shippingCost: shipping,
      gstAmount: gst,
      gstRate: gst > 0 ? Number(gstRate) || 18 : 0,
      totalAmount,
      status: "Confirmed",
      note: note || "Created from admin invoice generator",
    };

    if (invoiceDate) {
      const dated = new Date(`${invoiceDate}T12:00:00`);
      if (!Number.isNaN(dated.getTime())) {
        orderPayload.createdAt = dated;
        orderPayload.updatedAt = dated;
      }
    }

    const order = await Order.create(orderPayload);
    const populated = await Order.findById(order._id)
      .populate("user", "name email phone")
      .populate({
        path: "items.product",
        model: "Product",
        select: "name slug images price",
      });

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: populated,
    });
  } catch (error) {
    console.error("Create admin order error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create order",
      error: error.message,
    });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = [
      "Pending",
      "Confirmed",
      "Processing",
      "Shipped",
      "Delivered",
      "Cancelled",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    ).populate("user", "name email phone");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Order status updated",
      data: order,
    });
  } catch (error) {
    console.error("Update order status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update order status",
      error: error.message,
    });
  }
};
