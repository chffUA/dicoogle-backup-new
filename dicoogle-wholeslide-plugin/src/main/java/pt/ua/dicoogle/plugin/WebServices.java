package pt.ua.dicoogle.plugin;

import java.net.URL;
import net.jr.fastcgi.FastCGIServlet;

import org.apache.commons.configuration.ConfigurationException;
import org.apache.commons.configuration.XMLConfiguration;
import org.eclipse.jetty.rewrite.handler.RewriteHandler;
import org.eclipse.jetty.rewrite.handler.RewriteRegexRule;
import org.eclipse.jetty.server.handler.HandlerList;
import org.eclipse.jetty.servlet.DefaultServlet;
import org.eclipse.jetty.servlet.ServletContextHandler;
import org.eclipse.jetty.servlet.ServletHolder;

import pt.ua.dicoogle.sdk.JettyPluginInterface;
import pt.ua.dicoogle.sdk.settings.ConfigurationHolder;

/**
 * Web-services Plugin
 * 
 * @author Tiago Marques Godinho, tmgodinho@ua.pt
 *
 */
public class WebServices implements JettyPluginInterface {

  private ConfigurationHolder settings;
  private String cgi_server_addr;
  
  public String getName() {
    return "tmg_dwsp_webservices";
  }

  public boolean enable() {
    return true;
  }

  public boolean disable() {
    return false;
  }

  public boolean isEnabled() {
    return true;
  }

  public void setSettings(ConfigurationHolder settings) {
    this.settings = settings;
    XMLConfiguration cnf = this.settings.getConfiguration();
    boolean forceSave = false;
    
    cgi_server_addr = cnf.getString("fcgi-server-address", "127.0.0.1:6667");     
    if(!cnf.containsKey("fcgi-server-address")){
      cnf.setProperty("fcgi-server-address", cgi_server_addr);
      forceSave = true;
    }
    
    if(forceSave) {
      try {
        cnf.save();
      } catch (ConfigurationException e) {
        // TODO Auto-generated catch block
        e.printStackTrace();
      }
    }
  }

  public ConfigurationHolder getSettings() {
    return settings;
  }

  public HandlerList getJettyHandlers() {
    
    URL warUrl = this.getClass().getClassLoader().getResource("viewer");
    String warUrlString = warUrl.toExternalForm();
    
    ServletHolder cgi_holder = new ServletHolder();
    cgi_holder.setInitParameter("server-address", cgi_server_addr);
    cgi_holder.setServlet(new FastCGIServlet());
    
    ServletContextHandler handler = new ServletContextHandler();
    handler.setContextPath("/tmg/dwsp");
    handler.setResourceBase(warUrlString);
    handler.setWelcomeFiles(new String[]{"index.html"});
    handler.addServlet(new ServletHolder(new DefaultServlet()), "/");
    handler.addServlet(cgi_holder, "/image-service");
    handler.addServlet(new ServletHolder(new HelloWorldServlet()), "/hello");
    handler.addServlet(new ServletHolder(new InformationServet()), "/info");    
    handler.addServlet(new ServletHolder(new WSIPyramidInformationServet()), "/pinfo");
    handler.addServlet(new ServletHolder(new AnnotationService()), "/annotation");    
         
    RewriteHandler rewrite = new RewriteHandler();
    rewrite.setRewriteRequestURI(true);
    rewrite.setRewritePathInfo(true);
    
    RewriteRegexRule reverse = new RewriteRegexRule();
    reverse.setRegex("/tmg/dwsp/image-service/(.*)");
    reverse.setReplacement("/tmg/dwsp/image-service?IIIF=$1");
    reverse.setHandling(false);
    rewrite.addRule(reverse);
            
    rewrite.setHandler(handler);
                
    HandlerList l = new HandlerList();
    l.addHandler(rewrite);
    
    return l;
  }

}
