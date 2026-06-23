import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__brand">
          <div className="footer__logo">
            <img src="/cashtro-icon.png" alt="Cashtro" width="28" height="28" style={{ objectFit: 'contain' }} />
            <span className="footer__wordmark">Cashtro</span>
          </div>
          <p className="footer__tagline">Your money, finally organised.</p>
        </div>

        <div className="footer__cols">
          <div className="footer__col">
            <h4>Product</h4>
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="#">Download</a>
          </div>
          <div className="footer__col">
            <h4>Company</h4>
            <a href="#">About Us</a>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
          </div>
        </div>
      </div>

      <div className="footer__bottom">
        <div className="container">
          <p>© 2026 Cashtro Inc. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
