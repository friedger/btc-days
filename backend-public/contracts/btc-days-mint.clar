
(define-constant UPGRADE_FEE u60000000)

(define-read-only (get-owner-boom (id uint))
  (let ((boom-id (unwrap! (to-boom id) err-not-found)))
    (contract-call? 'SP497E7RX3233ATBS2AB9G4WTHB63X5PBSP5VGAQ.boom-nfts get-owner boom-id)))

;; upgrade btc btc-day
(define-public (upgrade (id uint))
  (let ((boom-id (unwrap! (to-boom id) err-not-found))
        (owner (unwrap! (unwrap! (contract-call? 'SP497E7RX3233ATBS2AB9G4WTHB63X5PBSP5VGAQ.boom-nfts get-owner boom-id) err-not-found) err-already-burnt)))
    (asserts! (or (is-eq tx-sender owner) (is-eq contract-caller owner)) err-not-authorized)
    (try! (stx-transfer? UPGRADE_FEE tx-sender 'SP2J56JG0SMAVW0DXXJ7W18W2CQHD1FE83FZCFV26))
    (try! (contract-call? 'SP497E7RX3233ATBS2AB9G4WTHB63X5PBSP5VGAQ.boom-nfts burn boom-id))
    (contract-call? .btc-days upgrade id)))

;; 1 <= id <= 7
(define-read-only (to-boom (id uint))
  (element-at btc-days (- id u1)))

(define-constant btc-days
  (list
    u1 u5535 u5957 u5587 u5588 u5615 u5632))

(contract-call? .btc-days set-mint)

(define-constant err-not-authorized (err u803))
(define-constant err-not-found (err u804))
(define-constant err-already-burnt (err u900))
