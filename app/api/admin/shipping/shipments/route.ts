import { NextRequest, NextResponse } from 'next/server';
import { ShippingEngine } from '@/lib/shipping/engine';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, providerId, courierId, courierName } = body;

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Order ID is required' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, customer: true }
    });

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const engine = ShippingEngine.getInstance();
    
    // If auto fulfillment requested or no specific manual provider selected
    if (!providerId || body.autoDispatch) {
      const fulfillment = await engine.autoFulfillOrder(orderId);
      if (!fulfillment.success) {
        return NextResponse.json({ success: false, error: fulfillment.error }, { status: 500 });
      }
      return NextResponse.json({ success: true, shipment: fulfillment.shipment, fulfillment });
    }

    const isCod = (order.paymentMethod || '').toUpperCase() === 'COD';

    const shipmentResult = await engine.createShipment({
      orderId: order.id,
      orderNumber: order.orderNumber,
      orderDate: order.createdAt.toISOString(),
      customer: {
        name: order.shippingName || order.customer?.name || 'Valued Customer',
        email: order.customer?.email || 'customer@example.com',
        phone: order.shippingPhone || order.customer?.phone || '9999999999',
        addressLine1: order.shippingAddress,
        city: order.shippingCity,
        state: order.shippingState,
        pincode: order.shippingPincode,
        country: 'India'
      },
      items: order.items.map((it: any) => ({
        name: it.productName || 'Luxury Garment',
        sku: it.productId.slice(0, 8),
        quantity: it.quantity,
        unitPrice: Number(it.price)
      })),
      isCod,
      codAmount: isCod ? Number(order.totalAmount) : 0,
      invoiceValue: Number(order.totalAmount),
      providerId: providerId || 'ithink',
      courierId,
      courierName
    });

    // Update order in database to SHIPPED status with live iThink Logistics details
    if (!shipmentResult.success || !shipmentResult.awbNumber) {
      return NextResponse.json({
        success: false,
        error: shipmentResult.error || 'iThink Logistics rejected shipment allocation'
      }, { status: 400 });
    }

    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'SHIPPED',
        shippingStatus: 'IN_TRANSIT',
        shippingError: null,
        awbNumber: shipmentResult.awbNumber,
        courierName: shipmentResult.courierName || courierName || 'Delhivery',
        trackingUrl: shipmentResult.trackingUrl || `https://www.ithinklogistics.co.in/postship/tracking/${shipmentResult.awbNumber}`,
        ithinkOrderId: shipmentResult.shipmentId || `ITHINK-${order.orderNumber}`,
        shippingLabelUrl: shipmentResult.labelUrl || `https://my.ithinklogistics.com/print_label?awb=${shipmentResult.awbNumber}`,
      }
    });

    return NextResponse.json({ success: true, shipment: shipmentResult });
  } catch (err: any) {
    console.error('Shipment creation error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
