
REVOKE EXECUTE ON FUNCTION public.booking_is_paid(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.expire_unpaid_bookings() FROM authenticated;
