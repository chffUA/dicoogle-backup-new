package pt.ua.dicoogle.plugin;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.eclipse.jetty.http.HttpStatus;

/**
 * Simple Helloworld servlet
 * 
 * @author Tiago Marques Godinho, tmgodinho@ua.pt
 *
 */
public class HelloWorldServlet extends HttpServlet {

  /**
   * 
   */
  private static final long serialVersionUID = 1L;
  

  @Override
  protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException,
      IOException {
    resp.setStatus(HttpStatus.OK_200);
    resp.getWriter().println("<h1>Hello World!!</h1>");
    resp.getWriter().flush();
  }  

}
